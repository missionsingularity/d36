import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
process.env.BRAHMA_DATA_DIR = fs.mkdtempSync(
  path.join(os.tmpdir(), "brahma-engine-"),
);
delete process.env.GEMINI_API_KEY;
import { db } from "../lib/enterprise/db";
import {
  employee,
  decide,
  execute,
  document,
  revise,
  requestLeave,
  submit,
} from "../lib/enterprise/service";
import {
  agents,
  launch,
  tick,
  runDetail,
  saveAgent,
  control,
  gateDecision,
  schedule,
  workerTick,
  validatePlan,
  tools,
  engineDb,
} from "../lib/enterprise/work-engine";
test("durable Work Engine scenarios", async (t) => {
  const maya = employee("maya"),
    admin = employee("sam"),
    it = employee("arjun"),
    hr = employee("leah");
  const start = async (agentId: string, mode = "workflow") => {
    const id = launch(maya, {
      agentId,
      instruction: "Run the published workflow",
      mode,
    });
    await tick(id);
    return id;
  };
  await t.test(
    "IT exact approval, reviewer execution, resume and idempotency",
    async () => {
      const id = await start("it");
      let r = runDetail(maya, id);
      assert.equal(r.status, "WAITING_FOR_APPROVAL");
      const approval = r.steps.find((s) => s.id === "approval")!
        .output as string;
      assert.throws(() => execute(maya, approval), /reviewer/);
      decide(it, { id: approval, decision: "approve" });
      execute(it, approval);
      await tick(id);
      r = runDetail(maya, id);
      assert.equal(r.status, "COMPLETED");
      assert.equal(r.receipts.length, 2);
      await tick(id);
      assert.equal(runDetail(maya, id).receipts.length, 2);
    },
  );
  await t.test(
    "project creation uses immutable action approval and team membership",
    async () => {
      const a = saveAgent(admin, {
        name: "Create project",
        description: "Create a team",
        instructions: "Create a team",
        scopes: ["workspace"],
        allowedTools: ["create_project", "assign_project_member"],
        approvalPolicy: "human",
        published: true,
        steps: [
          {
            id: "project",
            tool: "create_project",
            arguments: {
              title: "Engine project",
              body: "Real project",
              members: ["maya", "noah"],
            },
            dependsOn: [],
            approvalPolicy: "human",
          },
        ],
      });
      const id = await start(a.id);
      const r = runDetail(maya, id);
      assert.equal(r.status, "WAITING_FOR_APPROVAL");
      assert.throws(
        () =>
          gateDecision(maya, {
            runId: id,
            stepId: "project",
            decision: "approve",
            reason: "yes",
          }),
        /administrator/,
      );
      gateDecision(admin, {
        runId: id,
        stepId: "project",
        decision: "approve",
        reason: "Approved team",
      });
      await tick(id);
      const output = runDetail(maya, id).steps[0].output as { id: string };
      assert.ok(
        db().prepare("SELECT * FROM records WHERE id=?").get(output.id),
      );
      assert.equal(
        (
          db()
            .prepare("SELECT COUNT(*) n FROM relationships WHERE toId=?")
            .get(output.id) as { n: number }
        ).n,
        2,
      );
    },
  );
  await t.test(
    "weekly report is a persisted draft with source output",
    async () => {
      const id = await start("project"),
        r = runDetail(maya, id);
      assert.equal(r.status, "COMPLETED");
      const d = r.steps[1].output as { id: string };
      assert.equal(document(maya, d.id).status, "DRAFT");
      assert.match(document(maya, d.id).versions[0].content, /percent/);
    },
  );
  await t.test("leave agent inputs, approval and execution once", async () => {
    const id = launch(maya, {
      agentId: "hr",
      instruction: "Request annual leave",
      mode: "workflow",
      inputs: {
        requestLeave: true,
        start: "2026-12-07",
        end: "2026-12-08",
        reason: "Annual leave",
      },
    });
    await tick(id);
    const run = runDetail(maya, id);
    assert.equal(run.status, "WAITING_FOR_APPROVAL");
    const a = run.steps.find((s) => s.id === "approval")!.output as string;
    decide(hr, { id: a, decision: "approve" });
    const first = execute(hr, a);
    assert.deepEqual(execute(hr, a), first);
    assert.equal(employee("maya").leaveBalance, 16);
    await tick(id);
    assert.equal(runDetail(maya, id).status, "COMPLETED");
  });
  await t.test(
    "research sources preserve real IDs and enforce HR scope",
    async () => {
      const id = await start("research");
      assert.equal(runDetail(maya, id).status, "COMPLETED");
      const result = tools.search_records.run(maya, { query: "Noah" }) as {
        id: string;
        type: string;
        owner: string;
      }[];
      assert.ok(!result.some((r) => r.type === "HR" && r.owner !== "maya"));
    },
  );
  await t.test("document revision retains exact approved version", async () => {
    const id = await start("document");
    const d = runDetail(maya, id).steps[1].output as { id: string };
    const old = document(maya, d.id).versions[0];
    revise(maya, {
      id: d.id,
      title: old.title,
      content: "Revised source-backed brief",
      reason: "Review update",
      baseVersion: old.id,
    });
    assert.equal(document(maya, d.id).versions.length, 2);
    assert.throws(
      () =>
        db()
          .prepare("UPDATE versions SET content='bad' WHERE id=?")
          .run(old.id),
      /immutable/,
    );
  });
  await t.test(
    "ineligible replacement branch skips all dependent writes",
    async () => {
      const id = await start("it"),
        r = runDetail(maya, id);
      assert.equal(r.status, "COMPLETED");
      assert.equal(r.steps.find((s) => s.id === "request")!.status, "SKIPPED");
      assert.equal(r.receipts.length, 0);
    },
  );
  await t.test(
    "builder publishing pins old runs and restricts editing",
    async () => {
      const old = agents(admin).find((a) => a.id === "research")!;
      const id = launch(maya, {
        agentId: old.id,
        instruction: "Research",
        mode: "workflow",
      });
      assert.throws(
        () => saveAgent(maya, { ...old.config, id: old.id }),
        /Administrator/,
      );
      const next = saveAgent(admin, {
        ...old.config,
        id: old.id,
        name: "Research v2",
      });
      assert.equal(next.version, 2);
      await tick(id);
      assert.equal(runDetail(maya, id).version, 1);
      assert.throws(
        () =>
          validatePlan(
            {
              steps: [
                { id: "bad", tool: "run_sql", arguments: {}, dependsOn: [] },
              ],
            },
            old,
          ),
        /not allowed/,
      );
    },
  );
  await t.test("cancel and safe retry preserve completed writes", async () => {
    const a = saveAgent(admin, {
      name: "Retry scenario",
      description: "Safe retry",
      instructions: "Safe retry",
      scopes: ["workspace"],
      allowedTools: ["create_document_draft", "get_project"],
      approvalPolicy: "none",
      published: true,
      steps: [
        {
          id: "draft",
          tool: "create_document_draft",
          arguments: { title: "Keep this", content: "Saved exactly once" },
          dependsOn: [],
        },
        {
          id: "bad",
          tool: "get_project",
          arguments: { id: "missing" },
          dependsOn: ["draft"],
        },
      ],
    });
    const id = await start(a.id);
    const before = runDetail(maya, id);
    assert.equal(before.status, "FAILED");
    control(maya, id, "retry");
    await tick(id);
    assert.equal(runDetail(maya, id).receipts.length, 1);
    assert.deepEqual(
      runDetail(maya, id).steps[0].output,
      before.steps[0].output,
    );
    control(maya, id, "cancel");
    await tick(id);
    assert.equal(runDetail(maya, id).status, "CANCELLED");
  });
  await t.test(
    "offline Auto is explicitly labelled; unknown plans never execute",
    async () => {
      const id = await start("research", "auto");
      assert.equal(runDetail(maya, id).status, "COMPLETED");
      assert.ok(
        (runDetail(maya, id).events as { kind: string }[]).some(
          (e) => e.kind === "offline",
        ),
      );
    },
  );
  await t.test("due schedule persists and claims once", async () => {
    const sid = schedule(maya, {
      agentId: "project",
      instruction: "Friday report",
      nextAt: new Date(Date.now() - 1000).toISOString(),
      intervalHours: 168,
    });
    await workerTick();
    const row = engineDb()
      .prepare("SELECT nextAt FROM engine_schedules WHERE id=?")
      .get(sid) as { nextAt: string };
    assert.ok(row.nextAt > new Date().toISOString());
    const count = (
      engineDb()
        .prepare(
          "SELECT COUNT(*) n FROM engine_runs WHERE instruction='Friday report'",
        )
        .get() as { n: number }
    ).n;
    await workerTick();
    assert.equal(
      (
        engineDb()
          .prepare(
            "SELECT COUNT(*) n FROM engine_runs WHERE instruction='Friday report'",
          )
          .get() as { n: number }
      ).n,
      count,
    );
  });
  await t.test(
    "persisted queued work and expired leases recover through worker",
    async () => {
      const id = launch(maya, {
        agentId: "research",
        instruction: "Recover persisted queue",
        mode: "workflow",
      });
      engineDb()
        .prepare(
          "UPDATE engine_runs SET lease=?,planningOwner='old-process' WHERE id=?",
        )
        .run(Date.now() - 1000, id);
      const child = spawnSync(
        process.execPath,
        [
          path.resolve("node_modules/tsx/dist/cli.mjs"),
          "-e",
          `const {workerTick}=require('./lib/enterprise/work-engine');workerTick().catch(e=>{console.error(e.message);process.exitCode=1;});`,
        ],
        {
          env: process.env,
          encoding: "utf8",
          timeout: 30000,
          windowsHide: true,
        },
      );
      assert.equal(child.status, 0, child.stderr);
      assert.equal(runDetail(maya, id).status, "COMPLETED");
      assert.throws(() => runDetail(employee("noah"), id), /unavailable/);
    },
  );
  await t.test(
    "Auto retries provider failure and validates every step before writes",
    async () => {
      const original = globalThis.fetch;
      process.env.GEMINI_API_KEY = "isolated-test-key";
      let calls = 0;
      const response = (text: string) =>
        new Response(
          JSON.stringify({
            candidates: [{ content: { role: "model", parts: [{ text }] } }],
          }),
          { headers: { "Content-Type": "application/json" } },
        );
      try {
        globalThis.fetch = async () => {
          calls++;
          return calls === 1
            ? new Response(
                JSON.stringify({
                  error: {
                    code: 503,
                    message: "Unavailable",
                    status: "UNAVAILABLE",
                  },
                }),
                {
                  status: 503,
                  headers: { "Content-Type": "application/json" },
                },
              )
            : response(
                JSON.stringify({
                  steps: [
                    {
                      id: "project",
                      tool: "get_project",
                      arguments: { id: "alpha" },
                      dependsOn: [],
                      approvalPolicy: "none",
                    },
                  ],
                }),
              );
        };
        const id = await start("research", "auto");
        assert.equal(runDetail(maya, id).status, "COMPLETED");
        assert.equal(calls, 2);
        const before = (
          db().prepare("SELECT COUNT(*) n FROM documents").get() as {
            n: number;
          }
        ).n;
        globalThis.fetch = async () =>
          response(
            JSON.stringify({
              steps: [
                {
                  id: "draft",
                  tool: "create_document_draft",
                  arguments: {
                    title: "Must not exist",
                    content: "Invalid later step",
                  },
                  dependsOn: [],
                },
                {
                  id: "invalid",
                  tool: "get_project",
                  arguments: { unknown: "bad" },
                  dependsOn: ["draft"],
                },
              ],
            }),
          );
        const failed = await start("research", "auto");
        assert.equal(runDetail(maya, failed).status, "FAILED");
        assert.equal(
          (
            db().prepare("SELECT COUNT(*) n FROM documents").get() as {
              n: number;
            }
          ).n,
          before,
        );
      } finally {
        globalThis.fetch = original;
        delete process.env.GEMINI_API_KEY;
      }
    },
  );
  await t.test(
    "agent knowledge scope filters search and blocks out-of-scope IDs",
    async () => {
      const a = saveAgent(admin, {
        name: "IT only",
        description: "IT-only sources",
        instructions: "IT only",
        scopes: ["IT"],
        allowedTools: ["get_project"],
        steps: [
          {
            id: "read",
            tool: "get_project",
            arguments: { id: "alpha" },
            dependsOn: [],
          },
        ],
        published: true,
      });
      const id = await start(a.id);
      assert.equal(runDetail(maya, id).status, "FAILED");
      assert.match(runDetail(maya, id).error, /outside agent knowledge scope/);
    },
  );
});
