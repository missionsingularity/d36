import assert from "node:assert/strict";
import { test } from "node:test";
import { NextRequest } from "next/server";
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
