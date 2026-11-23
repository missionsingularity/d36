import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  authStatus,
  clearSessionCookie,
  identity,
  logout,
  sessionCookieName,
  setSessionCookie,
  setupFirstAdmin,
  signIn,
  switchDemoRole,
} from "@/lib/enterprise/auth";
import { WorkspaceError } from "@/lib/enterprise/service";
import { ZodError } from "zod";

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
  console.error("[BrahmaGPT Auth] Request failed", error);
  return NextResponse.json({ error: "Authentication service is temporarily unavailable." }, { status: 503 });
};
function sameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin || new URL(origin).host !== req.headers.get("host"))
    throw new WorkspaceError("Same-origin request required.", 403);
}
export async function GET(req: NextRequest) {
  try {
    const [status, user] = await Promise.all([authStatus(), identity(req)]);
    return NextResponse.json({
      ...status,
      authenticated: Boolean(user),
      user: user
        ? { id: user.id, name: user.name, email: user.email, role: user.role, demoAdmin: user.demoAdmin, demoRole: user.demoRole }
        : null,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[BrahmaGPT Auth] Session check failed", error);
    return NextResponse.json({ configured: false, authenticated: false, error: "Sign in is temporarily unavailable." }, { status: 503 });
  }
}
export async function POST(req: NextRequest) {
  try {
    sameOrigin(req);
    const body = await req.json();
    const action = z.string().parse(body.action);
    if (action === "setup") {
      const input = z.object({
        setupToken: z.string().min(1).max(300),
        email: z.string().email().max(254),
        password: z.string().min(12).max(256),
        name: z.string().trim().min(2).max(120),
      }).parse(body);
      await setupFirstAdmin(input);
      return NextResponse.json({ ok: true, message: "Administrator created. Sign in with the email and password you chose." });
    }
    if (action === "login") {
      const input = z.object({ email: z.string().email().max(254), password: z.string().min(1).max(256) }).parse(body);
      const result = await signIn(input.email, input.password);
      const response = NextResponse.json({ ok: true });
      setSessionCookie(response, result.token);
      return response;
    }
    if (action === "logout") {
      await logout(req.cookies.get(sessionCookieName())?.value);
      const response = NextResponse.json({ ok: true });
      clearSessionCookie(response);
      return response;
    }
    if (action === "switchDemoRole") {
      const role = z.enum(["admin", "manager", "employee"]).parse(body.role);
      await switchDemoRole(req.cookies.get(sessionCookieName())?.value, role);
      return NextResponse.json({ ok: true, role });
    }
    throw new WorkspaceError("Unknown authentication action.", 400);
  } catch (error) {
    return fail(error);
  }
}
