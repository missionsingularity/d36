# BrahmaGPT

A desktop-first, monochrome government-work demonstrator. All seeded records are synthetic, not government rules. Built as a single Next.js application; no paid AI API, Docker, or separate backend required.

## Local development

Node.js 22 or later. In PowerShell use `npm.cmd` when script execution policy prevents `npm`.

```sh
npm install
npm run dev
```

Open http://127.0.0.1:3000. Choose **Customize** to launch any of the ten workflows. Use **Open in Work** to inspect evidence, manage decisions and download outputs. Run `npm run typecheck`, `npm test`, `npm run build`, and `npm run test:e2e` for verification. Playwright uses an isolated demo store and requires Chromium (`npx playwright install chromium`). See [PROJECT_STATUS.md](PROJECT_STATUS.md) for test results and demo limits.

## Typed chat and project members

The New Chat composer executes local record queries on the server and retains conversation history. Supported examples include find documents about pension, show overdue tasks, and show pending approvals. The deterministic path is explicitly labelled. A remote model adapter is still pending.

Projects supports a local member picker and avatar stacks, duplicate prevention and last-owner protection. General project labels are separate from the grievance module's server-enforced department/district/case permissions. Demo identities resolve from opaque server-side sessions. Profile switches the original personas; Grievance has an explicit local role selector.

Use .env.example for optional local settings. Runtime records remain in the ignored .data directory. JSON transactions use an exclusive local writer lock and atomic rename; this is not a production multi-host database.

## Grievance Operations

Open `/projects/grievance` for internal intake, scoped case teams, typed relationships, preserved evidence versions, requirements/conflicts, tasks and follow-ups. Three local CSV/JSON adapters retain canonical source snapshots and import reports. Proposal approval is separate from ATR/reply review, manual submission proof, independent acknowledgement, appeals, disposal and closure. Nothing sends to a government service.

Typed case Chat stages supported changes for confirmation against the same backend as Work. Permitted originals and extracted text appear in Documents; case assignments appear in My Tasks. The original ten demonstrations and five output formats remain available.

See the [reviewer script](docs/GRIEVANCE_DEMO.md), [architecture](docs/GRIEVANCE_ARCHITECTURE.md), [API](docs/GRIEVANCE_API.md), [import guide](docs/LEGACY_IMPORT_GUIDE.md) and [acceptance report](GRIEVANCE_TEST_REPORT.md). Keep confidential records and credentials out of this demonstration.
