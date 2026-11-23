import { NextResponse } from "next/server";
import { checkSupabasePostgres } from "@/lib/enterprise/supabase-status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const status = await checkSupabasePostgres();
  return NextResponse.json(status, {
    status: status.connected ? 200 : 503,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
