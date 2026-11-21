import { test } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
process.env.BRAHMA_DATA_DIR = fs.mkdtempSync(
  path.join(os.tmpdir(), "brahma-enterprise-"),
);
delete process.env.GEMINI_API_KEY;
import { db } from "../lib/enterprise/db";
import {
  employee,
  search,
  progress,
  replacement,
  draft,
  revise,
  submit,
  decide,
  execute,
  document,
  snapshot,
  createProject,
  requestLeave,
  updateTask,
} from "../lib/enterprise/service";
import { runChat, planSchema } from "../lib/enterprise/planner";
import { importCsv, parseCsv } from "../lib/enterprise/import";

test("enterprise scenarios, permissions, exact versions and receipts", async (t) => {
  const maya = employee("maya"),
    it = employee("arjun"),
    hr = employee("leah"),
    admin = employee("sam");
  await t.test(
    "1. SQLite FTS5 searches actual permitted company documents",
    () => {
      const r = search(maya, "replacement", "Documents");
      assert(r.some((r) => r.id === "policy-it"));
      assert(!search(maya, "onboarding").some((r) => r.id === "hr-noah"));
      assert(search(hr, "onboarding").some((r) => r.id === "hr-noah"));
      assert(!snapshot(it).records.some((r) => r.id === "hr-maya"));
    },
  );
  await t.test(
    "2. unresolved project incidents and deterministic policy",
    () => {
      const r = replacement(maya, "asset-1");
      assert.equal(r.incidents.length, 2);
      assert(r.eligible);
      assert(!replacement(maya, "asset-2").eligible);
      assert(r.incidents.every((i) => i.project === "alpha"));
    },
  );
  let replacementDocument = "";
  await t.test(
    "3. multi-step replacement draft, independent approval and idempotent execution",
    async () => {
      const { run, chatId } = await runChat(maya, {
        prompt:
          "Find laptop replacement issues in Project Alpha, prepare requests and send for approval",
      });
      assert.equal(run.mode, "OFFLINE LOCAL MODE");
      assert.equal(run.status, "Pending approval");
      assert.equal(
        run.events.filter((e) => e.status === "completed").length,
        5,
      );
      assert(run.sources.some((s) => s.id === "policy-it"));
      replacementDocument = run.documentId!;
      const a = snapshot(it).approvals.find(
        (a) => a.documentId === replacementDocument,
      )!;
      assert(a);
      assert.throws(() => decide(maya, { id: a.id, decision: "approve" }));
      decide(it, { id: a.id, decision: "approve" });
      const receipt = execute(it, a.id);
      assert.equal(execute(it, a.id).id, receipt.id);
      assert.equal(
        snapshot(maya).records.find((r) => r.id === "asset-1")!.status,
        "Replacement ordered",
      );
      assert(
        snapshot(maya).chats.find((c) => c.id === chatId)?.messages.length ===
          2,
      );
      assert.equal(
        (
          db()
            .prepare("SELECT COUNT(*) AS n FROM receipts WHERE approvalId=?")
            .get(a.id) as { n: number }
        ).n,
        1,
      );
    },
  );
  await t.test("4. project creation persists multiple members", () => {
    const id = createProject(maya, {
      title: "New launch",
      body: "Prepare launch",
      members: ["maya", "noah", "arjun"],
    });
    const p = snapshot(maya).records.find((r) => r.id === id)!;
    assert.equal((p.data.members as string[]).length, 3);
    assert.equal(
      (
        db()
          .prepare("SELECT COUNT(*) AS n FROM relationships WHERE toId=?")
          .get(id) as { n: number }
      ).n,
      3,
    );
  });
  await t.test(
    "5. report uses actual tasks and task dependencies prevent false completion",
    async () => {
      const p = progress(maya, "alpha");
      assert.equal(p.percent, 33);
      assert.throws(
        () => updateTask(maya, { id: "task-3", status: "Done" }),
        /dependencies/,
      );
      const { run } = await runChat(maya, {
        prompt: "Generate project progress report for Alpha",
      });
      assert.equal(run.status, "Completed");
      assert(
        document(maya, run.documentId!).versions[0].content.includes(
          "1 of 3 tasks complete (33%)",
        ),
      );
    },
  );
  await t.test(
    "6-7. template document revision, immutability, return comments and stale approvals",
    () => {
      const template = (
        snapshot(maya).settings.templates as { name: string; content: string }[]
      )[0];
      let d = draft(maya, { title: template.name, content: template.content });
      const original = d.versions[0];
      d = revise(maya, {
        id: d.id,
        baseVersion: original.id,
        title: d.title,
        content: original.content + "\nRevision",
        reason: "Add weekly progress",
      });
      assert.equal(d.versions.length, 2);
      assert.equal(d.versions[0].content, original.content);
      assert.throws(
        () =>
          db()
            .prepare("UPDATE versions SET content=? WHERE id=?")
            .run("tampered", original.id),
        /immutable/,
      );
      assert.throws(
        () =>
          revise(maya, {
            id: d.id,
            baseVersion: original.id,
            title: d.title,
            content: "stale",
            reason: "stale",
          }),
        /newer version/,
      );
      const a = submit(maya, d.id);
      assert.throws(
        () => decide(it, { id: a, decision: "approve" }),
        /reviewer/,
      );
      decide(admin, { id: a, decision: "return", comment: "Add evidence" });
      d = document(maya, d.id);
      assert.equal(d.versions.length, 3);
      assert.equal(d.status, "RETURNED");
      d = revise(maya, {
        id: d.id,
        baseVersion: d.versions.at(-1)!.id,
        title: d.title,
        content: "Updated with evidence",
        reason: "Address reviewer",
      });
      const b = submit(maya, d.id);
      decide(admin, { id: b, decision: "approve" });
      revise(maya, {
        id: d.id,
        baseVersion: d.versions.at(-1)!.id,
        title: d.title,
        content: "A new version",
        reason: "New change after approval",
      });
      assert.throws(() => execute(admin, b), /version mismatch/);
    },
  );
  await t.test(
    "8. HR leave balance changes exactly once after authorized approval",
    () => {
      const d = requestLeave(maya, {
        start: "2026-12-07",
        end: "2026-12-09",
        reason: "Personal time",
      });
      assert.throws(() => document(it, d.id), /unavailable/);
      const a = submit(maya, d.id);
      assert.throws(() => decide(it, { id: a, decision: "approve" }));
      decide(hr, { id: a, decision: "approve" });
      const receipt = execute(hr, a);
      assert.equal(execute(hr, a).id, receipt.id);
      assert.equal(employee("maya").leaveBalance, 15);
      assert.throws(
        () =>
          requestLeave(employee("maya"), {
            start: "2026-02-30",
            end: "2026-03-03",
            reason: "Bad dates",
          }),
        /valid/,
      );
    },
  );
  await t.test(
    "9. mapped CSV validation, duplicates and actual import receipt",
    () => {
      const args = {
        kind: "Assets",
        csv: 'identifier,name,details\nlegacy-1,"Legacy, laptop",Imported asset',
        mapping: { id: "identifier", title: "name", body: "details" },
        confirm: false,
      };
      const preview = importCsv(admin, args);
      assert.equal(preview.errors.length, 0);
      assert.equal(preview.rows[0].title, "Legacy, laptop");
      const saved = importCsv(admin, { ...args, confirm: true });
      assert("receipt" in saved);
      assert(search(maya, "Legacy").some((r) => r.id === "legacy-1"));
      assert.throws(
        () => importCsv(admin, { ...args, confirm: true }),
        /duplicate/,
      );
      assert.throws(() => importCsv(maya, args), /Administrator/);
      assert.throws(() => parseCsv('a,b\n"unterminated'), /quotation/);
    },
  );
  await t.test(
    "10. missing key is truthful, planner rejects unsafe/oversized plans",
    async () => {
      const { run } = await runChat(maya, { prompt: "Find company policy" });
      assert.equal(run.mode, "OFFLINE LOCAL MODE");
      assert.equal(run.status, "Completed");
      assert(
        !planSchema.safeParse({
          steps: [{ tool: "execute_code", query: "delete everything" }],
        }).success,
      );
      assert(
        !planSchema.safeParse({
          steps: Array.from({ length: 9 }, () => ({ tool: "search_records" })),
        }).success,
      );
      assert(
        !planSchema.safeParse({
          steps: [{ tool: "search_records", dependsOn: ["self"] }],
        }).success,
      );
    },
  );
  await t.test(
    "shared persistence, audit and unauthorized conversations",
    async () => {
      assert(snapshot(maya).audit.length > 0);
      assert(
        db().prepare("SELECT version FROM migrations WHERE version=1").get(),
      );
      const chat = snapshot(maya).chats[0];
      await assert.rejects(
        () => runChat(it, { prompt: "read another chat", chatId: chat.id }),
        /unavailable/,
      );
    },
  );
});
