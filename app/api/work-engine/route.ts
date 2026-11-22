import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/enterprise/db";
import { employee, WorkspaceError } from "@/lib/enterprise/service";
import {
  overview,
  runDetail,
  launch,
  tick,
  control,
  saveAgent,
  gateDecision,
  schedule,
  toggleSchedule,
} from "@/lib/enterprise/work-engine";
import { z } from "zod";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function identity(req: NextRequest) {
  const token = req.cookies.get("singularity-session")?.value;
  const row = token
    ? (db()
        .prepare("SELECT userId FROM sessions WHERE token=? AND expires>?")
        .get(token, Date.now()) as { userId: string } | undefined)
    : undefined;
  if (!row) throw new WorkspaceError("Session required", 401);
  return employee(row.userId);
}
function fail(e: unknown) {
  return NextResponse.json(
    { error: e instanceof Error ? e.message : "Request failed" },
    {
      status:
        e instanceof WorkspaceError
          ? e.status
          : e instanceof z.ZodError
            ? 400
            : 400,
    },
  );
}
export async function GET(req: NextRequest) {
  try {
    const u = identity(req);
    const id = req.nextUrl.searchParams.get("run");
    return NextResponse.json(id ? runDetail(u, id) : overview(u));
  } catch (e) {
    return fail(e);
  }
}
export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get("origin");
    if (
      !origin ||
      new URL(origin).host !== req.headers.get("host") ||
      !/^https?:/.test(origin)
    )
      throw new WorkspaceError("Same-origin request required", 403);
    if (Number(req.headers.get("content-length") || 0) > 150000)
      throw new Error("Request too large");
    const u = identity(req),
      b = await req.json();
    let result: unknown;
    switch (b.action) {
      case "launch":
        result = launch(u, b.input);
        break;
      case "tick":
        runDetail(u, String(b.id));
        await tick(String(b.id));
        result = runDetail(u, String(b.id));
        break;
      case "control":
        control(u, String(b.id), String(b.control));
        result = true;
        break;
      case "saveAgent":
        result = saveAgent(u, b.input);
        break;
      case "decision":
        gateDecision(u, b.input);
        result = true;
        break;
      case "schedule":
        result = schedule(u, b.input);
        break;
      case "scheduleToggle":
        toggleSchedule(u, z.string().parse(b.id), z.boolean().parse(b.enabled));
        result = true;
        break;
      default:
        throw new Error("Unknown action");
    }
    return NextResponse.json({ result });
  } catch (e) {
    return fail(e);
  }
}
