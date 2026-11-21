import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { getPlan, runChat } from "../lib/enterprise/planner";
import { employee } from "../lib/enterprise/service";
import { geminiFailure } from "../lib/enterprise/gemini";
process.env.BRAHMA_DATA_DIR = fs.mkdtempSync(
  path.join(os.tmpdir(), "brahma-gemini-"),
);
test("official Gemini SDK validates plans and truthfully records model failures", async (t) => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = "synthetic-test-key-not-a-real-credential";
  try {
    await t.test(
      "SDK request uses structured schema and parses a registered plan",
      async () => {
        let called = false;
        globalThis.fetch = async (input, init) => {
          called = true;
          const body = JSON.parse(init?.body as string);
          assert(body.generationConfig.responseJsonSchema);
          return new Response(
            JSON.stringify({
              candidates: [
                {
                  content: {
                    role: "model",
                    parts: [
                      {
                        text: JSON.stringify({
                          steps: [{ tool: "search_records", query: "Alpha" }],
                        }),
                      },
                    ],
                  },
                  finishReason: "STOP",
                },
              ],
            }),
            { headers: { "Content-Type": "application/json" } },
          );
        };
        const out = await getPlan("Find Alpha");
        assert(called);
        assert.equal(out.mode, "LIVE GEMINI");
        assert.equal(out.plan.steps[0].tool, "search_records");
      },
    );
    await t.test(
      "malformed structured plan is rejected before any tool mutation",
      async () => {
        globalThis.fetch = async () =>
          new Response(
            JSON.stringify({
              candidates: [
                {
                  content: {
                    role: "model",
                    parts: [{ text: '{"steps":[{"tool":"execute_code"}]}' }],
                  },
                },
              ],
            }),
            { headers: { "Content-Type": "application/json" } },
          );
        const { run } = await runChat(employee("maya"), {
          prompt: "Find Alpha",
        });
        assert.equal(run.status, "Failed");
        assert(!run.documentId);
        assert.equal(run.events.at(-1)?.status, "failed");
      },
    );
    await t.test(
      "rejected credentials produce a clear persisted failure",
      async () => {
        globalThis.fetch = async () =>
          new Response(
            JSON.stringify({
              error: {
                code: 403,
                message: "API key invalid",
                status: "PERMISSION_DENIED",
              },
            }),
            { status: 403, headers: { "Content-Type": "application/json" } },
          );
        const { run } = await runChat(employee("maya"), {
          prompt: "Find Alpha",
        });
        assert.equal(run.status, "Failed");
        assert(run.events.at(-1)?.detail.includes("credentials were rejected"));
      },
    );
    await t.test(
      "network outage preserves truthful failure, never fake completion",
      async () => {
        globalThis.fetch = async () => {
          throw new Error("Network unavailable");
        };
        const { run } = await runChat(employee("maya"), {
          prompt: "Find Alpha",
        });
        assert.equal(run.status, "Failed");
        assert.equal(run.events.at(-1)?.status, "failed");
      },
    );
    await t.test(
      "temporary high demand is retried before tools run",
      async () => {
        let calls = 0;
        globalThis.fetch = async () => {
          calls++;
          if (calls === 1)
            return new Response(
              JSON.stringify({
                error: {
                  code: 503,
                  message: "High demand",
                  status: "UNAVAILABLE",
                },
              }),
              { status: 503, headers: { "Content-Type": "application/json" } },
            );
          return new Response(
            JSON.stringify({
              candidates: [
                {
                  content: {
                    role: "model",
                    parts: [
                      {
                        text: JSON.stringify({
                          steps: [{ tool: "search_records", query: "Alpha" }],
                        }),
                      },
                    ],
                  },
                },
              ],
            }),
            { headers: { "Content-Type": "application/json" } },
          );
        };
        const { run } = await runChat(employee("maya"), {
          prompt: "Find Alpha",
        });
        assert.equal(calls, 2);
        assert.equal(run.status, "Completed");
        assert.equal(
          run.events.filter((e) => e.tool === "search_records").length,
          1,
        );
        assert(run.events.some((e) => e.tool === "retry_planning"));
      },
    );
    await t.test(
      "persistent deadlines stop after three attempts with a readable error",
      async () => {
        let calls = 0;
        globalThis.fetch = async () => {
          calls++;
          return new Response(
            JSON.stringify({
              error: {
                code: 504,
                message: "Deadline expired before operation could complete.",
                status: "DEADLINE_EXCEEDED",
              },
            }),
            { status: 504, headers: { "Content-Type": "application/json" } },
          );
        };
        const { run } = await runChat(employee("maya"), {
          prompt: "Find Alpha",
        });
        assert.equal(calls, 3);
        assert.equal(run.status, "Failed");
        assert(!run.documentId);
        assert(run.events.at(-1)?.detail.includes("took too long"));
        assert(!run.events.at(-1)?.detail.includes("DEADLINE_EXCEEDED"));
      },
    );
    await t.test(
      "billing and unavailable models have distinct errors and are not retried",
      async () => {
        let calls = 0;
        globalThis.fetch = async () => {
          calls++;
          return new Response(
            JSON.stringify({
              error: {
                code: 403,
                message: "Free tier unavailable. Set up billing.",
                status: "PERMISSION_DENIED",
              },
            }),
            { status: 403, headers: { "Content-Type": "application/json" } },
          );
        };
        const { run } = await runChat(employee("maya"), {
          prompt: "Find Alpha",
        });
        assert.equal(calls, 1);
        assert(run.events.at(-1)?.detail.includes("billing"));
        assert.equal(
          geminiFailure({ status: 404, message: "Model not found" }).retryable,
          false,
        );
        assert(
          geminiFailure({
            status: 404,
            message: "Model not found",
          }).message.includes("GEMINI_MODEL"),
        );
        const failure = geminiFailure({
          status: 503,
          message: "High demand " + process.env.GEMINI_API_KEY,
        });
        assert(!failure.message.includes(process.env.GEMINI_API_KEY!));
      },
    );
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalKey;
  }
});
