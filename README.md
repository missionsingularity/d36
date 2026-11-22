# BrahmaGPT by Singularity

A local enterprise workspace with a search-first interface, Gemini tool planning, SQLite FTS5, linked IT/Projects/HR records, immutable documents, independent approvals and real execution receipts. All seeded people and policies are fictional.

## Start on Windows

Requires Node.js 22.15 or later and npm. Use `npm.cmd` in PowerShell if script execution policy blocks `npm`.

```powershell
cd C:\Users\spond\Singularity\d36
npm.cmd ci
npm.cmd run setup
npm.cmd run seed
npm.cmd run dev
```

Open http://127.0.0.1:3000. The database seeds automatically on first use, so `seed` is optional. Setup preserves any existing `.env.local` and all data. No Docker or enterprise API account is required.

Home and enterprise search share one Assistant workspace. Use the organization search bar (or Ctrl+K) to search in place; the query survives refresh. New chat is the first sidebar action. Featured agents open a detailed launch page with capabilities, version, inputs and Auto/Workflow selection. Work contains the library, runs, approvals, history, and administrator builder, tools, templates and schedules. The separate Search navigation and Chat/Work header switch have been replaced by this unified flow.

The development launcher refuses duplicate servers and occupied ports, then clears only its generated development output before starting. Production output and your data are preserved. For ordinary use after a build, run `npm.cmd start`; use `npm.cmd run dev` when editing the code.

## Add your Gemini API key later

Open `.env.local` in this project's root:

```dotenv
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-3.8-flash
```

Get a key from https://aistudio.google.com/apikey. Keep it private. This file is ignored by Git. Stop the running server with Ctrl+C and run `npm.cmd run dev` again. Settings includes the same instructions. A configured key enables LIVE GEMINI planning; a rejected key creates a visible failed workflow. Live planning was verified with the configured account. Provider availability and model access can change; failures remain visible.

Leave the key blank to use OFFLINE LOCAL MODE. Local search, predefined Alpha replacement/report workflows, editing, project creation, leave requests, imports and authorized approvals work without it.

## Try the complete local workflow

1. As Maya, ask: `Find unresolved laptop issues affecting Project Alpha, check the replacement policy, prepare requests and send to the IT Manager for approval.`
2. Inspect the citations, real execution timeline and saved draft.
3. In Settings switch to Arjun Mehta (IT Manager).
4. Open Approvals, approve the exact version, then execute the approved action.
5. Inspect the procurement record and receipt. Refresh to confirm persistence. No external procurement order is sent.

For HR leave approval use Leah Chen. Sam Patel administers workspace configuration and CSV import. Demo role switching is enabled by `DEMO_MODE=true`; these identities are not production authentication. The server binds to loopback.

## Commands

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run test:e2e
npm.cmd run test:legacy
npm.cmd run build
npm.cmd start
# In a second terminal, for unattended work and schedules:
npm.cmd run worker
```

Install Chromium with `npx.cmd playwright install chromium` if absent. Browser tests run their own isolated server on port 3100 and save screenshots under `.qa/`. `lint` validates formatting; TypeScript supplies static type checking. `test:legacy` retains the original government-domain service regressions, without exposing the retired application or APIs.

## Work Engine

Open `/work`. Published agents are versioned; running work stays pinned to its original version. Auto asks Gemini for a validated plan. Workflow executes published steps and explicit branch conditions. With no key, Auto explicitly uses the published local workflow. Conversation tool calls use this same durable executor.

SQLite stores runs, steps, attempts, events, exact action gates, receipts, agent versions, launch inputs and schedules. Each local write and its step receipt commit in one transaction. Safe retry retains completed steps and permits at most three attempts per step. The worker claims persisted work with a database lease, resumes approval waits, and recovers expired claims after restart. No external procurement or HR service is contacted.

Run `npm.cmd run worker` alongside the app for schedules and recovery while no browser is open. Leave both processes running for unattended work. Document approvals require an independent authorized reviewer to approve the exact version and explicitly execute; the waiting run then resumes. Other gated actions require an independent administrator decision on the resolved payload.

See [Work Engine operations](docs/WORK_ENGINE.md) for builder, schedule, permission and recovery details.

## Files and recovery

- `.env.local`: local server credentials; never committed.
- `.data/enterprise.sqlite`: live enterprise database; never committed. Existing prior databases are untouched.
- `lib/enterprise/`: retrieval, deterministic calculations, tool planner, governed execution and CSV import.
- `app/enterprise-workspace.tsx`, `app/workspace-home.tsx`, `app/message-body.tsx`: shared shell, personalized home feed and readable chat responses.
- `app/workspace-search.tsx`, `app/work-agents.tsx`: unified organization search and working agent entry points.
- `app/enterprise.css` and `app/product.css`: base components and refined product styling; Inter Variable fonts are hosted locally.
- `tests/legacy-support/`: historical synthetic fixtures and services for regression tests only.
- `checkpoint/pre-enterprise-rebuild-20261122`: original code checkpoint in Git. Ignored `recovery-before-rebuild.bundle` is a verified full-history local backup.

For a cold backup stop the server and copy the entire `.data` directory, including any SQLite WAL files. Never commit that directory. Back up `.env.local` privately if needed.

See [Architecture](docs/ARCHITECTURE.md), [demonstrations](docs/DEMO_SCENARIOS.md), [acceptance evidence](docs/ACCEPTANCE_TESTS.md), [design references](docs/DESIGN_REFERENCES.md), [rebuild audit](docs/REBUILD_AUDIT.md), [progress](docs/IMPLEMENTATION_PROGRESS.md) and [known limitations](docs/KNOWN_LIMITATIONS.md). Historical status reports are preserved in docs/archive; current rebuild evidence is in these docs.

This is a working bounded prototype, not every feature of the full enterprise vision. Plain-text editing, Latin-font PDF export, predefined offline planning and local demo identities are deliberate current limits. Advanced administration, maintenance scheduling and complete onboarding workflows remain incomplete.
