import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";
import postgres, { type Sql } from "postgres";
import { WorkspaceError } from "./service";
import { db } from "./db";
import type { Employee } from "./types";

const SESSION_COOKIE = "brahma-session";
const SESSION_DAYS = 30;
type DemoRole = "admin" | "manager" | "employee";
type Profile = {
  user_id: string;
  email: string;
  display_name: string;
  role: string;
  workspace_id: string;
  demo_admin: boolean;
};
type SessionRow = {
  user_id: string;
  access_token: string;
  refresh_token: string;
  access_expires_at: number;
  active_role: DemoRole;
  expires_at: Date;
};

let sqlClient: Sql | undefined;
let schemaReady: Promise<void> | undefined;
function getSql() {
  const url = process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;
  if (!url) throw new Error("Supabase PostgreSQL is not configured.");
  return (sqlClient ||= postgres(url, {
    max: 3,
    prepare: false,
    connect_timeout: 8,
    idle_timeout: 20,
  }));
}
async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      const sql = getSql();
      await sql`CREATE TABLE IF NOT EXISTS public.brahma_auth_profiles (
        user_id uuid PRIMARY KEY,
        email text NOT NULL UNIQUE,
        display_name text NOT NULL,
        role text NOT NULL CHECK (role IN ('admin','manager','employee')),
        workspace_id text NOT NULL,
        demo_admin boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now()
      )`;
      await sql`CREATE TABLE IF NOT EXISTS public.brahma_auth_sessions (
        token_hash text PRIMARY KEY,
        user_id uuid NOT NULL REFERENCES public.brahma_auth_profiles(user_id) ON DELETE CASCADE,
        access_token text NOT NULL,
        refresh_token text NOT NULL,
        access_expires_at bigint NOT NULL,
        active_role text NOT NULL CHECK (active_role IN ('admin','manager','employee')),
        expires_at timestamptz NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )`;
      await sql`CREATE INDEX IF NOT EXISTS brahma_auth_sessions_expiry ON public.brahma_auth_sessions(expires_at)`;
      await sql`ALTER TABLE public.brahma_auth_profiles ENABLE ROW LEVEL SECURITY`;
      await sql`ALTER TABLE public.brahma_auth_sessions ENABLE ROW LEVEL SECURITY`;
      await sql`CREATE TABLE IF NOT EXISTS public.brahma_auth_setup (
        id boolean PRIMARY KEY DEFAULT true CHECK (id),
        completed_at timestamptz NOT NULL DEFAULT now(),
        user_id uuid NOT NULL
      )`;
      await sql`ALTER TABLE public.brahma_auth_setup ENABLE ROW LEVEL SECURITY`;
      await sql`REVOKE ALL ON public.brahma_auth_profiles,public.brahma_auth_sessions,public.brahma_auth_setup FROM anon,authenticated`;
    })().catch((error) => {
      schemaReady = undefined;
      throw error;
    });
  }
  await schemaReady;
}
function supabaseUrl() {
  const value = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!value) throw new Error("Supabase URL is not configured.");
  return value.replace(/\/$/, "");
}
function publicKey() {
  const value =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;
  if (!value) throw new Error("Supabase publishable key is not configured.");
  return value;
}
function secretKey() {
  const value =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!value) throw new Error("Supabase server key is not configured.");
  return value;
}
function sessionEncryptionKey() {
  const value = process.env.BRAHMA_SESSION_ENCRYPTION_KEY;
  const key = value ? Buffer.from(value, "base64") : Buffer.alloc(0);
  if (key.length !== 32) throw new Error("BrahmaGPT session encryption is not configured.");
  return key;
}
function encryptSessionValue(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", sessionEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), ciphertext].map((part) => part.toString("base64url")).join(".");
}
function decryptSessionValue(value: string) {
  const [iv, tag, data] = value.split(".").map((part) => Buffer.from(part, "base64url"));
  if (!iv || iv.length !== 12 || !tag || tag.length !== 16 || !data) throw new Error("Invalid session data.");
  const decipher = createDecipheriv("aes-256-gcm", sessionEncryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
function safeEqual(left: string, right: string) {
  const a = createHash("sha256").update(left).digest();
  const b = createHash("sha256").update(right).digest();
  return timingSafeEqual(a, b);
}
function tokenHash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
async function authRequest(path: string, key: string, init?: RequestInit) {
  return fetch(`${supabaseUrl()}/auth/v1/${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      apikey: key,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
}
async function parseAuthError(response: Response) {
  const result = (await response.json().catch(() => ({}))) as {
    msg?: string;
    message?: string;
    error_description?: string;
  };
  const raw = result.msg || result.message || result.error_description || "";
  if (response.status === 400 || response.status === 401)
    return new Error("Email or password is incorrect.");
  console.error("[BrahmaGPT Auth] Supabase Auth request failed", response.status, raw.slice(0, 300));
  return new Error("Sign in is temporarily unavailable. Please try again later.");
}
export async function authStatus() {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`SELECT user_id FROM public.brahma_auth_setup WHERE id=true`;
  const hasPublicKey = Boolean(
    process.env.SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY,
  );
  return {
    configured: true,
    setupAvailable: rows.length === 0 && Boolean(process.env.BRAHMA_FIRST_ADMIN_SETUP_TOKEN) && hasPublicKey && Boolean(process.env.BRAHMA_SESSION_ENCRYPTION_KEY),
    publishableKeyConfigured: hasPublicKey,
    sessionEncryptionConfigured: Boolean(process.env.BRAHMA_SESSION_ENCRYPTION_KEY),
  };
}
export async function setupFirstAdmin(input: {
  setupToken: string;
  email: string;
  password: string;
  name: string;
}) {
  const expected = process.env.BRAHMA_FIRST_ADMIN_SETUP_TOKEN;
  if (!expected || expected.length < 32 || !safeEqual(input.setupToken, expected))
    throw new Error("The one-time setup code is incorrect or unavailable.");
  publicKey();
  secretKey();
  sessionEncryptionKey();
  if (input.password.length < 12)
    throw new Error("Use a password with at least 12 characters.");
  await ensureSchema();
  const sql = getSql();
  let createdUserId: string | undefined;
  try {
    await sql.begin(async (tx) => {
      await tx`SELECT pg_advisory_xact_lock(839174201)`;
      const used = await tx`SELECT user_id FROM public.brahma_auth_setup WHERE id=true`;
      if (used.length) throw new Error("The first administrator has already been set up.");
      const response = await authRequest("admin/users", secretKey(), {
        method: "POST",
        headers: { Authorization: `Bearer ${secretKey()}` },
        body: JSON.stringify({
          email: input.email,
          password: input.password,
          email_confirm: true,
          user_metadata: { full_name: input.name, account_type: "brahmagpt_demo_admin" },
        }),
      });
      if (!response.ok) throw await parseAuthError(response);
      const result = (await response.json()) as { id: string; email?: string };
      createdUserId = result.id;
      await tx`INSERT INTO public.brahma_auth_profiles
        (user_id,email,display_name,role,workspace_id,demo_admin)
        VALUES (${result.id}::uuid,${input.email.toLowerCase()},${input.name},'admin','demo-default',true)`;
      await tx`INSERT INTO public.brahma_auth_setup(id,user_id) VALUES (true,${result.id}::uuid)`;
    });
  } catch (error) {
    if (createdUserId) {
      const rollbackUser = await authRequest(`admin/users/${encodeURIComponent(createdUserId)}`, secretKey(), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${secretKey()}` },
      }).catch(() => undefined);
      if (!rollbackUser?.ok)
        console.error("[BrahmaGPT Auth] Could not remove the unprovisioned first-admin Auth user.");
    }
    throw error;
  }
}
export async function signIn(email: string, password: string) {
  await ensureSchema();
  sessionEncryptionKey();
  const response = await authRequest("token?grant_type=password", publicKey(), {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw await parseAuthError(response);
  const session = (await response.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    user: { id: string; email?: string };
  };
  const sql = getSql();
  const profiles = await sql<Profile[]>`
    SELECT user_id::text,email,display_name,role,workspace_id,demo_admin
    FROM public.brahma_auth_profiles WHERE user_id=${session.user.id}::uuid`;
  if (!profiles.length) throw new Error("This account has not been added to a BrahmaGPT workspace.");
  if (!(profiles[0].role === "admin" || profiles[0].role === "manager" || profiles[0].role === "employee"))
    throw new Error("This account has an invalid workspace role.");
  const token = randomBytes(32).toString("base64url");
  await sql`INSERT INTO public.brahma_auth_sessions
    (token_hash,user_id,access_token,refresh_token,access_expires_at,active_role,expires_at)
    VALUES (${tokenHash(token)},${session.user.id}::uuid,${encryptSessionValue(session.access_token)},${encryptSessionValue(session.refresh_token)},
    ${Math.floor(Date.now() / 1000) + session.expires_in},${profiles[0].role},${new Date(Date.now() + SESSION_DAYS * 86400000)})`;
  return { token, profile: profiles[0] };
}
export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  });
}
export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
export async function logout(token: string | undefined) {
  if (!token) return;
  await ensureSchema();
  await getSql()`DELETE FROM public.brahma_auth_sessions WHERE token_hash=${tokenHash(token)}`;
}
export async function identity(req: NextRequest): Promise<Employee | undefined> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return;
  await ensureSchema();
  const sql = getSql();
  const hash = tokenHash(token);
  const rows = await sql<{
    user_id: string;
    access_token: string;
    refresh_token: string;
    access_expires_at: number;
    active_role: DemoRole;
    email: string;
    display_name: string;
    role: string;
    workspace_id: string;
    demo_admin: boolean;
  }[]>`
    SELECT s.user_id::text,s.access_token,s.refresh_token,s.access_expires_at,s.active_role,
      p.email,p.display_name,p.role,p.workspace_id,p.demo_admin
    FROM public.brahma_auth_sessions s JOIN public.brahma_auth_profiles p USING(user_id)
    WHERE s.token_hash=${hash} AND s.expires_at>now()`;
  const row = rows[0];
  if (!row) return;
  let accessToken = row.access_token;
  const apiKey = publicKey();
  if (Number(row.access_expires_at) < Math.floor(Date.now() / 1000) + 90) {
    const refreshed = await sql.begin(async (tx) => {
      await tx`SELECT pg_advisory_xact_lock(hashtext(${hash}))`;
      const currentRows = await tx<{ access_token: string; refresh_token: string; access_expires_at: number }[]>`
        SELECT access_token,refresh_token,access_expires_at FROM public.brahma_auth_sessions
        WHERE token_hash=${hash} AND expires_at>now() FOR UPDATE`;
      const current = currentRows[0];
      if (!current) return;
      if (Number(current.access_expires_at) >= Math.floor(Date.now() / 1000) + 90)
        return decryptSessionValue(current.access_token);
      const response = await authRequest("token?grant_type=refresh_token", apiKey, {
        method: "POST",
        body: JSON.stringify({ refresh_token: decryptSessionValue(current.refresh_token) }),
      });
      if (!response.ok) {
        await tx`DELETE FROM public.brahma_auth_sessions WHERE token_hash=${hash}`;
        return;
      }
      const next = (await response.json()) as {
        access_token: string;
        refresh_token: string;
        expires_in: number;
      };
      const expiry = Math.floor(Date.now() / 1000) + next.expires_in;
      await tx`UPDATE public.brahma_auth_sessions SET access_token=${encryptSessionValue(next.access_token)},
        refresh_token=${encryptSessionValue(next.refresh_token)},access_expires_at=${expiry},updated_at=now()
        WHERE token_hash=${hash}`;
      return next.access_token;
    });
    if (typeof refreshed !== "string") return;
    accessToken = refreshed;
  } else {
    accessToken = decryptSessionValue(accessToken);
  }
  const verified = await authRequest("user", apiKey, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!verified.ok) {
    await sql`DELETE FROM public.brahma_auth_sessions WHERE token_hash=${hash}`;
    return;
  }
  const verifiedUser = (await verified.json().catch(() => ({}))) as { id?: string };
  if (verifiedUser.id !== row.user_id) {
    await sql`DELETE FROM public.brahma_auth_sessions WHERE token_hash=${hash}`;
    return;
  }
  if (row.workspace_id === "demo-default") {
    const sampleId = row.active_role === "admin" ? "sam" : row.active_role === "manager" ? "maya" : "noah";
    const sample = db().prepare("SELECT * FROM employees WHERE id=?").get(sampleId) as Employee | undefined;
    if (!sample) return;
    return {
      ...sample,
      role: row.active_role,
      name: row.display_name,
      email: row.email,
      demoAdmin: row.demo_admin,
      demoRole: row.active_role,
    };
  }
  return;
}
export async function switchDemoRole(token: string | undefined, role: DemoRole) {
  if (!token) throw new Error("Sign in first.");
  await ensureSchema();
  const sql = getSql();
  const profile = await sql<{ demo_admin: boolean; workspace_id: string }[]>`
    SELECT p.demo_admin,p.workspace_id FROM public.brahma_auth_sessions s
    JOIN public.brahma_auth_profiles p USING(user_id)
    WHERE s.token_hash=${tokenHash(token)} AND s.expires_at>now()`;
  if (!profile[0]?.demo_admin || profile[0].workspace_id !== "demo-default")
    throw new Error("Only the demo administrator can switch demo roles.");
  await sql`UPDATE public.brahma_auth_sessions SET active_role=${role},updated_at=now()
    WHERE token_hash=${tokenHash(token)}`;
}
export function sessionCookieName() {
  return SESSION_COOKIE;
}
export function requireWorkspaceWriteAccess(user: Employee) {
  if (user.role === "viewer")
    throw new WorkspaceError("This account does not have permission to make changes.", 403);
}
