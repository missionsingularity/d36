# BrahmaGPT D-36 Implementation Status

Updated: 2026-11-24  
Baseline commit: `c0349f6cb6c12f2f6964c6620e2c66e699447540` (`main`, matched `origin/main` at audit start)

This is a release-readiness snapshot. It distinguishes verified local behavior from missing production services; code being present does not prove a live integration works.

## Verification in this workspace

| Area | Result | Evidence |
|---|---|---|
| TypeScript | Passed | `npm.cmd run typecheck` |
| Main service tests | Passed | `npm.cmd test`: 38 passed |
| Legacy scenario tests | Passed | `npm.cmd run test:legacy`: 60 passed |
| Browser suite | Passed cases; runner shutdown issue | `npm.cmd run test:e2e -- --timeout=60000`: all 6 cases displayed `ok`, covering Work Engine, report draft/approval, exports, settings, imports, cross-origin/security checks, and unified search. Playwright's Windows server cleanup hung after results, so the process was interrupted before its final summary/exit code. |
| Production build | Passed | `npm.cmd run build` with Next.js 15.5.29; webpack emitted non-fatal cache snapshot warnings. |
| Vercel-mode API smoke | Passed | Production server with `VERCEL=1`: `/api/workspace` and `/api/work-engine` GET returned 200; attempted mutations returned 403 read-only. The simulation used temporary local storage and does not verify a real Vercel deployment. |
| Approval database | Passed locally | `PRAGMA table_info(approvals)` shows 11 columns; migrations 1–8 present. Existing active database was inspected read-only. Current schema retains reviewer, project and idempotency fields. |
| Gemini live request | Failed / unavailable | A server-side smoke request using the configured key/model returned the app's generic temporary-connectivity failure. Mocked Gemini tests passing do not prove provider connectivity. |

The browser test process needed a temporary ignored Node preload because this host's `os.userInfo()` returned `ENOMEM`; that host workaround was not added to repository code.

## Current implementation status

## Enterprise workspace repair pass (2026-11-24)

- Removed provider/model terminology and key setup controls from user-facing Settings, assistant messages, and Work mode. Server-side provider configuration remains an administrator/deployment concern; provider failures are shown in plain language.
- Added a zoomable, collapsible organization chart based on saved reporting relationships and project-scoped task editing (assignee, priority, due date, title and details) with stale-update checking, assignment notification and audit entry.
- TypeScript and production build passed after these changes. Unit and legacy suites pass when launched with a temporary, ignored Node preload that works around this host's `os.userInfo()` `ENOMEM` error; the workaround is not committed.
- Regression coverage for project manager edits and stale task updates was added. The enterprise suite passed 42/42, the legacy suite passed 60/60, and TypeScript passed. All six browser tests displayed `ok`; Playwright then hung during Windows server cleanup, so its process was interrupted before a final exit summary.
- The deployed Supabase check returned a reachable PostgreSQL URL and configured Supabase API credentials. This verifies connectivity only. SQLite remains the authoritative application database and `/tmp` remains ephemeral; Supabase data migration, employee login, private persistent file storage, and hosted deployment validation are outstanding.

## Supabase Auth and demo-role login (2026-11-24)

- Added a BrahmaGPT-styled login and one-time first-admin setup. Supabase Auth performs password login; PostgreSQL stores demo profile records and per-browser sessions. The browser receives only a 256-bit opaque HttpOnly cookie, while access and refresh tokens are AES-GCM encrypted in PostgreSQL.
- Added Admin, Manager and Employee demo roles, server-stored role switching per session, sign-out, access-token refresh and role-based API/data visibility. Demo role switching is enabled only for the first-admin demo profile. Unauthenticated workspace, Work Engine and Supabase status requests are denied.
- Setup requires Vercel environment variables documented in `docs/AUTH_SETUP.md`, including a publishable/anon key, first-admin one-time code and session encryption key. No credentials are included in the repository.
- The first administrator can sign in against persistent Supabase Auth, but this deployment has not yet been given the additional publishable key, first-admin code or encryption key in this workspace. The first account cannot be provisioned or live-tested until those deployment values are set.
- Workspace tasks, documents, approvals and files remain in the old SQLite service. Vercel still uses temporary storage for those records; this login change does not make their writes durable across serverless instances/redeploys or connect real organization profiles.

| Requirement | Status | Findings and remaining work |
|---|---|---|
| Local workspace, search and citations | Working locally | Next App Router provides `/api/workspace` and `/api/work-engine`; SQLite FTS5 supports search, and source previews use bundled source packs. Home search now supports keyboard focus and a direct handoff to chat. |
| Approval schema and workflow recovery | Working locally | Explicit insert columns, exact document-version linkage, requester/reviewer/project metadata, idempotency, audit records and retry behavior are covered by service/browser tests. Manager resolution uses stored reporting relationships and profile hierarchy data. |
| Documents and exports | Working locally | Draft versioning, source references, PDF/DOCX/XLSX/PPTX generation, downloads and approval UI are present and browser-checked. Generated files still use local/temporary storage and are not durable across Vercel instances. |
| Work Engine | Working locally; serverless limits remain | Persisted local runs, steps, gates, agent builder and schedules are covered by tests. No durable Vercel queue/worker is configured; unattended schedules are not verified online. |
| IT Operations | Partial | Incidents, assets, services and several actions exist. Full change lifecycle, maintenance, reports, durable storage and production permissions are not verified. |
| Customize and imports | Partial; local CSV path verified | Import preview, duplicate detection, local execution and receipt are browser-tested. External employee/project/document connectors are not configured. |
| Gemini | Implemented; provider unavailable in smoke test | Server-side SDK, structured plans, tool validation and bounded retries exist. The current live key/model did not complete the connectivity check. No Gemini key is configured for Vercel in this workspace. |
| Authentication | Supabase Auth implemented; first-admin setup pending | Password sign-in, single-use bootstrap setup, persistent profile/session rows, encrypted refresh tokens, logout and session-local demo role switching are implemented. Vercel needs `SUPABASE_PUBLISHABLE_KEY`, `BRAHMA_FIRST_ADMIN_SETUP_TOKEN`, and `BRAHMA_SESSION_ENCRYPTION_KEY` configured before provisioning and live browser tests. Only the demo workspace is provisioned by this setup flow. |
| Resource permissions | Demo roles have scoped access; production authorization remains incomplete | Admin, manager and employee snapshots differ; sensitive API routes reject unauthenticated requests, reviewers can access assigned drafts, and role-specific write guards remain. Real employee provisioning, persistent organization data isolation, and full route/resource authorization still need review before live company data. |
| Vercel database durability | Supabase connectivity confirmed; application migration outstanding | The deployed `/api/supabase/status` returned `configured:true`, `connected:true`, `connectionVariable:"POSTGRES_URL"`, and `supabaseApiConfigured:true`. This confirms database reachability only. Vercel mode still writes SQLite under a writable temporary directory; the application has not switched to PostgreSQL. |
| Private file storage | Missing | Source packs are bundled, but uploads/generated files do not use a private persistent object-storage service. |
| Vercel project/deployment | Blocked by external access | No linked `.vercel/project.json`, Vercel CLI/token, or deployment credentials are available. The deployment was not changed or verified. |
| Gemini, multi-user and redeploy acceptance | Not passed | Live Gemini failed; Supabase is reachable but not used by workspace data. Persistent object storage and real sign-in provider remain unconfigured, so cross-user and redeploy survival cannot pass yet. |

## External setup needed for production

1. Connect the existing Vercel project and provide deployment access for `missionsingularity/d36`.
2. Migrate the current synchronous `better-sqlite3` layer and FTS5 to a PostgreSQL-compatible data layer. Supabase is reachable through `POSTGRES_URL`; migrate with backups while preserving IDs and history, and test all services against PostgreSQL before routing live traffic to it.
3. Configure private object storage and migrate/reconcile generated files and uploads.
4. Configure an identity provider and server-side secrets; decide whether the public read-only preview remains enabled.
5. Set `GEMINI_API_KEY` and `GEMINI_MODEL` as server-only Vercel variables, then run a live request against that deployed project.
6. Re-run cross-user access tests, migration tests and redeploy persistence checks against those services before using real organizational data.

Do not treat Vercel `/tmp` as production persistence. The current Vercel change prevents the read-only filesystem startup exception and blocks writes from the anonymous preview; it does not satisfy durable storage, real authentication or full enterprise authorization.
