import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  authStatus,
  clearSessionCookie,
  logout,
  sessionCookieName,
  setSessionCookie,
  setupFirstAdmin,
  signIn,
  switchDemoRole,
  verifySession,
} from "@/lib/enterprise/auth";
import { WorkspaceError } from "@/lib/enterprise/service";
import { ZodError } from "zod";
import { logApiRequest, requestId } from "@/lib/enterprise/api-observability";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const safeAuthMessages = new Set([
  "Email or password is incorrect.",
  "Sign in is temporarily unavailable. Please try again later.",
  "The one-time setup code is incorrect or unavailable.",
  "Use a password with at least 12 characters.",
  "The first administrator has already been set up.",
  "This account has not been added to a BrahmaGPT workspace.",
  "This account has an invalid workspace role.",
  "Sign in first.",
  "Only the demo administrator can switch demo roles.",
]);
const fail = (error: unknown) => {
  if (error instanceof WorkspaceError)
    return NextResponse.json({ error: error.message }, { status: error.status });
  if (error instanceof ZodError)
    return NextResponse.json({ error: "Check the details and try again." }, { status: 400 });
  if (error instanceof Error && safeAuthMessages.has(error.message))
    return NextResponse.json({ error: error.message }, { status: 400 });
  console.info(JSON.stringify({
    event: "auth_request_failure",
    errorType: error instanceof Error ? error.name : "Error",
    ...(typeof (error as { code?: unknown })?.code === "string" && /^[A-Z0-9_]{1,40}$/.test((error as { code: string }).code)
      ? { errorCode: (error as { code: string }).code }
      : {}),
  }));
  return NextResponse.json({ error: "Authentication service is temporarily unavailable." }, { status: 503 });
};
function sameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin || new URL(origin).host !== req.headers.get("host"))
    throw new WorkspaceError("Same-origin request required.", 403);
}
export async function GET(req: NextRequest) {
  const id = requestId(req);
  const startedAt = Date.now();
  let stage = "session_verification";
  try {
    if (req.nextUrl.searchParams.has("status")) {
      stage = "auth_status_database";
      const status = await authStatus();
      logApiRequest({ route: "/api/auth", requestId: id, stage, startedAt, status: 200 });
      return NextResponse.json(status, { headers: { "Cache-Control": "no-store" } });
    }
    const user = await verifySession(req);
    if (!user) {
      logApiRequest({ route: "/api/auth", requestId: id, stage, startedAt, status: 401 });
      return NextResponse.json({ authenticated: false, error: "Sign in required.", requestId: id }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }
    logApiRequest({ route: "/api/auth", requestId: id, stage, startedAt, status: 200 });
    return NextResponse.json({
      authenticated: true,
      user: { id: user.userId, name: user.name, email: user.email, role: user.role, demoAdmin: user.demoAdmin, demoRole: user.role },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    logApiRequest({ route: "/api/auth", requestId: id, stage, startedAt, status: 503, error });
    return NextResponse.json({ authenticated: false, error: "We couldn’t check your sign-in. Retry or sign out.", requestId: id }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
export async function POST(req: NextRequest) {
  const id = requestId(req);
  const startedAt = Date.now();
  let stage = "request_validation";
  try {
    sameOrigin(req);
    const body = await req.json();
    const action = z.string().parse(body.action);
    stage = `auth_${action}`;
    if (action === "setup") {
      const input = z.object({
        setupToken: z.string().min(1).max(300),
        email: z.string().email().max(254),
        password: z.string().min(12).max(256),
        name: z.string().trim().min(2).max(120),
      }).parse(body);
      await setupFirstAdmin(input);
      logApiRequest({ route: "/api/auth", requestId: id, stage, startedAt, status: 200 });
      return NextResponse.json({ ok: true, message: "Administrator created. Sign in with the email and password you chose." });
    }
    if (action === "login") {
      const input = z.object({ email: z.string().email().max(254), password: z.string().min(1).max(256) }).parse(body);
      const result = await signIn(input.email, input.password);
      const response = NextResponse.json({ ok: true });
      setSessionCookie(response, result.token);
      logApiRequest({ route: "/api/auth", requestId: id, stage, startedAt, status: 200 });
      return response;
    }
    if (action === "logout") {
      const response = NextResponse.json({ ok: true });
      clearSessionCookie(response);
      try {
        await logout(req.cookies.get(sessionCookieName())?.value);
      } catch (error) {
        logApiRequest({ route: "/api/auth", requestId: id, stage: "logout_session_delete", startedAt, status: 200, error });
      }
      logApiRequest({ route: "/api/auth", requestId: id, stage, startedAt, status: 200 });
      return response;
    }
    if (action === "switchDemoRole") {
      const role = z.enum(["admin", "manager", "employee"]).parse(body.role);
      await switchDemoRole(req.cookies.get(sessionCookieName())?.value, role);
      logApiRequest({ route: "/api/auth", requestId: id, stage, startedAt, status: 200 });
      return NextResponse.json({ ok: true, role });
    }
    throw new WorkspaceError("Unknown authentication action.", 400);
  } catch (error) {
    const response = fail(error);
    logApiRequest({ route: "/api/auth", requestId: id, stage, startedAt, status: response.status, error });
    return response;
  }
}
