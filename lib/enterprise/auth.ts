import type { NextRequest } from "next/server";
import { db } from "./db";
import { employee, WorkspaceError } from "./service";
import type { Employee } from "./types";

export const PUBLIC_VIEWER_TOKEN = "public-demo-viewer";

export function publicViewerIdentity(): Employee {
  const sample = employee("maya");
  return {
    ...sample,
    id: "public-viewer",
    name: "Public Preview",
    email: "public-viewer@demo.invalid",
    department: "Company",
    role: "viewer",
    leaveBalance: 0,
  };
}

export function identity(req: NextRequest): Employee | undefined {
  const token = req.cookies.get("singularity-session")?.value;
  if (process.env.VERCEL === "1")
    return token === PUBLIC_VIEWER_TOKEN
      ? publicViewerIdentity()
      : undefined;
  const session = token
    ? (db()
        .prepare("SELECT userId FROM sessions WHERE token=? AND expires>?")
        .get(token, Date.now()) as { userId: string } | undefined)
    : undefined;
  return session ? employee(session.userId) : undefined;
}

export function requireWorkspaceWriteAccess(user: Employee) {
  if (process.env.VERCEL === "1" || user.role === "viewer")
    throw new WorkspaceError(
      "This public preview is read-only until sign-in is configured.",
      403,
    );
}
