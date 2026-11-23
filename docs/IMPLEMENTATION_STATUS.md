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

| Requirement | Status | Findings and remaining work |
|---|---|---|
| Local workspace, search and citations | Working locally | Next App Router provides `/api/workspace` and `/api/work-engine`; SQLite FTS5 supports search, and source previews use bundled source packs. Home search now supports keyboard focus and a direct handoff to chat. |
| Approval schema and workflow recovery | Working locally | Explicit insert columns, exact document-version linkage, requester/reviewer/project metadata, idempotency, audit records and retry behavior are covered by service/browser tests. Manager resolution uses stored reporting relationships and profile hierarchy data. |
| Documents and exports | Working locally | Draft versioning, source references, PDF/DOCX/XLSX/PPTX generation, downloads and approval UI are present and browser-checked. Generated files still use local/temporary storage and are not durable across Vercel instances. |
| Work Engine | Working locally; serverless limits remain | Persisted local runs, steps, gates, agent builder and schedules are covered by tests. No durable Vercel queue/worker is configured; unattended schedules are not verified online. |
| IT Operations | Partial | Incidents, assets, services and several actions exist. Full change lifecycle, maintenance, reports, durable storage and production permissions are not verified. |
| Customize and imports | Partial; local CSV path verified | Import preview, duplicate detection, local execution and receipt are browser-tested. External employee/project/document connectors are not configured. |
| Gemini | Implemented; provider unavailable in smoke test | Server-side SDK, structured plans, tool validation and bounded retries exist. The current live key/model did not complete the connectivity check. No Gemini key is configured for Vercel in this workspace. |
| Authentication | Not production-ready | Vercel currently issues a virtual, read-only `Public Preview` viewer so the bundled sample workspace can open. This is not employee authentication. Local demo persona switching is isolated behind `DEMO_MODE`; a real identity provider, login/logout and session lifecycle remain unconfigured. |
| Resource permissions | Partial; not sufficient for production | Read/write guards, HR restrictions, reviewer checks and agent scopes exist, but resource classification, project/team access, relationship traversal and all sensitive routes need a full authorization audit before real data is used. |
| Vercel database durability | Missing | Vercel mode writes SQLite under a writable temporary directory to avoid the `/var/task/.data` startup error. That filesystem is ephemeral and instance-local; it does not provide shared data or persistence after redeploy. |
| Private file storage | Missing | Source packs are bundled, but uploads/generated files do not use a private persistent object-storage service. |
| Vercel project/deployment | Blocked by external access | No linked `.vercel/project.json`, Vercel CLI/token, or deployment credentials are available. The deployment was not changed or verified. |
| Gemini, multi-user and redeploy acceptance | Not passed | Live Gemini failed; no hosted database, persistent object storage or real sign-in provider is configured, so cross-user and redeploy survival cannot pass yet. |

## External setup needed for production

1. Connect the existing Vercel project and provide deployment access for `missionsingularity/d36`.
2. Select and configure a managed persistent database. The current synchronous `better-sqlite3` layer and FTS5 are not a drop-in match for hosted PostgreSQL/Turso clients; choose a compatible adapter and migrate with backups while preserving IDs and history.
3. Configure private object storage and migrate/reconcile generated files and uploads.
4. Configure an identity provider and server-side secrets; decide whether the public read-only preview remains enabled.
5. Set `GEMINI_API_KEY` and `GEMINI_MODEL` as server-only Vercel variables, then run a live request against that deployed project.
6. Re-run cross-user access tests, migration tests and redeploy persistence checks against those services before using real organizational data.

Do not treat Vercel `/tmp` as production persistence. The current Vercel change prevents the read-only filesystem startup exception and blocks writes from the anonymous preview; it does not satisfy durable storage, real authentication or full enterprise authorization.
