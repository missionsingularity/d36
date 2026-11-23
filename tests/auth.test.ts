import assert from "node:assert/strict";
import { test } from "node:test";
import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { GET as authGET } from "../app/api/auth/route";
import { setSessionCookie } from "../lib/enterprise/auth";
import { requestJson } from "../app/request-json";
import { GET as workspaceGET, POST as workspacePOST } from "../app/api/workspace/route";
import { GET as engineGET, POST as enginePOST } from "../app/api/work-engine/route";
import { GET as supabaseGET } from "../app/api/supabase/status/route";

test("workspace APIs require an authenticated session before reading or writing", async () => {
  const workspace = await workspaceGET(new NextRequest("https://d36.example/api/workspace"));
  assert.equal(workspace.status, 401);
  const engine = await engineGET(new NextRequest("https://d36.example/api/work-engine"));
  assert.equal(engine.status, 401);
  const status = await supabaseGET(new NextRequest("https://d36.example/api/supabase/status"));
  assert.equal(status.status, 401);

  const headers = { origin: "https://d36.example", host: "d36.example", "content-type": "application/json" };
  const workspaceWrite = await workspacePOST(new NextRequest("https://d36.example/api/workspace", {
    method: "POST", headers, body: JSON.stringify({ action: "settings" }),
  }));
  assert.equal(workspaceWrite.status, 401);
  const engineWrite = await enginePOST(new NextRequest("https://d36.example/api/work-engine", {
    method: "POST", headers, body: JSON.stringify({ action: "launch" }),
  }));
  assert.equal(engineWrite.status, 401);
});

test("auth status reports safe setup flags without exposing secrets", async () => {
  const response = await authGET(new NextRequest("https://d36.example/api/auth?status=1"));
  assert.equal(response.status, 200);
  const status = await response.json();
  assert.equal(typeof status.setupAvailable, "boolean");
  assert.equal(Array.isArray(status.missingLoginConfiguration), true);
  assert.equal("SUPABASE_SECRET_KEY" in status, false);
  assert.equal("BRAHMA_SESSION_ENCRYPTION_KEY" in status, false);
});

test("lightweight session verification rejects requests without cookies", async () => {
  const response = await authGET(new NextRequest("https://d36.example/api/auth?session=1"));
  assert.equal(response.status, 401);
  const status = await response.json();
  assert.equal(status.authenticated, false);
  assert.equal(typeof status.requestId, "string");
});

test("production session cookie is Secure, HttpOnly, SameSite=Lax and host-wide", () => {
  const environment = process.env as Record<string, string | undefined>;
  const original = environment.NODE_ENV;
  environment.NODE_ENV = "production";
  try {
    const response = NextResponse.json({ ok: true });
    setSessionCookie(response, "test-session-value");
    const cookie = response.headers.get("set-cookie") || "";
    assert.match(cookie, /brahma-session=test-session-value/);
    assert.match(cookie, /HttpOnly/i);
    assert.match(cookie, /Secure/i);
    assert.match(cookie, /SameSite=Lax/i);
    assert.match(cookie, /Path=\//i);
  } finally {
    if (original === undefined) delete environment.NODE_ENV;
    else environment.NODE_ENV = original;
  }
});

test("startup JSON requests abort on timeout and return a readable retry error", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (_input, init) => new Promise((_resolve, reject) => {
    init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
  });
  try {
    await assert.rejects(requestJson("/api/auth?session=1", {}, 5), /took too long/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
