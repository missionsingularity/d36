import { NextResponse } from "next/server";
import { checkSupabasePostgres } from "@/lib/enterprise/supabase-status";
import { identity } from "@/lib/enterprise/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: import("next/server").NextRequest) {
  if (!(await identity(req)))
    return NextResponse.json({ error: "Sign in required." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  const status = await checkSupabasePostgres();
  return NextResponse.json(status, {
    status: status.connected ? 200 : 503,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
