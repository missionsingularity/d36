# Singularity enterprise workspace

One root Next.js App Router application. `/` and the catch-all route render the shared client shell. `/api/workspace` is a server-only, same-origin endpoint. No mandatory external enterprise integrations, Docker, PostgreSQL or Redis.

## Modules

- **Brahma**: `lib/enterprise/service.ts` retrieves permission-filtered records through SQLite FTS5. Search, citations, previews and planner evidence share the access check. Private HR material is limited to its owner, HR Manager or administrator.
- **Vishnu**: linked projects, members, tasks, assets and incidents; deterministic project completion, task dependency checks, replacement eligibility and working-day leave calculations. `relationships` indexes typed edges. Business calculations use saved records rather than model arithmetic.
- **Mahesh**: immutable draft versions, review/return, exact-version independent approval, governed execution, idempotent receipts, notifications and audit history.
- **Planner**: official `@google/genai` SDK, structured JSON schema and strict Zod validation, at most eight sequential registered tools. Tool arguments and resource permissions are checked again at execution. No arbitrary code or SQL tools. Gemini never approves or executes actions. Offline mode uses clearly labeled predefined workflows.

## Persistence

`.data/enterprise.sqlite` is separate from any prior government database, which remains untouched. `better-sqlite3` supplies FTS5 on Windows; the installed Node 22.15.1 `node:sqlite` build lacks it. WAL, foreign keys, busy timeout and transactional mutations are enabled. A versioned migration creates employee, session, record/FTS, document, immutable version, approval, chat/message, workflow/event, receipt, audit, notification, relationship, import and settings tables. Existing versions cannot be updated or deleted through SQLite triggers. Text attachments are saved as searchable, versioned document content. Export downloads generate actual PDF/DOCX bytes from the requested saved version.

Approvals pin a version ID and content hash. Execution rechecks actor, independence, latest version, state, asset eligibility or leave balance/overlap and receipt uniqueness within one SQLite transaction. A returned version produces a new editable version. A stale browser must reload before saving.

## Local identities

Opaque, expiring, HttpOnly, SameSite=Strict session cookies resolve identity server-side. `DEMO_MODE=true` permits switching fictional personas in Settings; normal API bodies do not choose the acting identity. The app binds to loopback. This is a local prototype, not production authentication. Do not expose it publicly or add real employee data.

## Gemini key

Server-only `GEMINI_API_KEY` and `GEMINI_MODEL` are read from `.env.local`. No client key field or key-returning API exists. Missing key selects offline mode. Credential, quota, network and schema errors persist as failed workflow events. Completed operations remain visible when a later tool fails; there is no invented rollback or success.
