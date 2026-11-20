# Customize v2 implementation status

Updated 21 November 2026. Official `origin` is `https://github.com/missionsingularity/d36.git`, branch `main`. Latest checkpoint `62cc07d` was pushed successfully. Earlier milestones below are historical.

## Current application

- Next.js app is running persistently at `http://127.0.0.1:3000`; the homepage and `/api/demo?kind=health` returned HTTP 200.
- Ten deterministic, offline demonstrations use persistent SQLite records, linked synthetic source PDFs/DOCX, citations, review gates and generated PDF/DOCX/XLSX/PPTX/TXT outputs. The five-scene pension grievance is browser-tested through review, local dispatch receipt, follow-up and closure.
- The workflow editor, shared Chat/Work navigation, grievance lifecycle, role-scoped case records, legacy sample imports, documents, My Tasks, preferences, theme persistence and secondary workspace pages have browser coverage.
- Local demo personas and local dispatch are simulations. No government system, external AI, email, signature, or live connector is configured. Scanned-document OCR and multilingual PDF rendering are limited; production authentication and multi-host infrastructure are out of scope.

## Verification on 21 November

- `npm.cmd test`: 60 passed, 0 failed.
- `npm.cmd run typecheck`: passed.
- `npm.cmd run build` with isolated `.next-build-final`: passed.
- Playwright full run reached all 59 tests; 56 passed. Three test failures were isolated to test assumptions/state carry-over. The corrected settings and three workspace journeys passed together; the dispatch journey passed separately; grievance selection, legacy import and guest permission corrections also passed focused reruns. This is verified coverage of every test, but not one aggregate 59/59 run.
- The ten output workflows each passed result, citation preview and five-format download checks. Nine additional scenario variants plus the flagship passed source-opening, persistence and five-format browser checks.
- The Playwright wrapper can remain alive after printing the final test results; its idle teardown was interrupted after capturing the results. Node 22 reports its built-in SQLite experimental warning. No page exception was reported in the passed journeys.

## Remaining limits

The application demonstrates source-backed local actions and human approval gates; it does not send or write back to real government systems. Connector registration is local configuration only, scanned originals need manual verification, and accessibility has interaction/layout coverage but no formal audit. See `docs/DEMO_TEST_RESULTS.md` for detailed outcomes.

## First verified milestone
Checkpoint 604c5d6 pushed successfully to official main. Corrected export format casing. Flagship service test passed; actual Chromium five-scene journey passed in 15.9s (30.0s total), including source previews, v1/v2, wrong-role denial, local receipt, closure blockers, follow-up, reload and five downloads. Restarted stalled development listener in persistent session 86222; /customize returned HTTP 200 on port 3000. Full v2 scope remains in progress.

## Template milestone
Added six-stage autosaved editor at /workflows, 10 published seed templates, independent-role/dependency/source validation, immutable publish, duplicate, and version-pinned real engine runs with actual tasks. Two template service tests pass, including execution of all ten operations and invalid-cycle/source rejection. Existing 47 services plus flagship test pass (48 total). Connector disable and return-correction task controls added. New builder + flagship + ten-export Chromium run is active. Full v2 fixture world, SQLite adapter, advanced connector onboarding and expanded scenario interactions remain pending.

## Shared records and Chat milestone
All 12 focused Chromium journeys passed (builder, flagship, ten source/citation/five-format output cases), 1.6 minutes. Added exact DEMO grievance reference resolution and confirmed Chat-to-section-review actions; generic API cannot bypass that review gate. Added idempotent shared-world seed: four cases, 12 pension and eight movement snapshots, 16 actual two-page PDF/Word originals with scoped downloads. Shared-world service test passes, plus all 51 current engine/grievance/guided/template tests. demo:seed and non-destructive demo:reset scripts added; reset creates a new namespace and retains prior records/files. World seed test is now included in npm test. Current source pack is exposed in Customize; full v2 scenario-specific use of it remains in progress.

## SQLite checkpoint
All 52 service tests passed with local SQLite. Added separate migration test proving exact JSON/backup preservation, typed template/link indexes and failed-mutation rollback. Production build passed at .next-build-customize-v2. Existing JSON and its backup are retained; SQLite is now authoritative. Node's built-in SQLite emits an experimental warning on Node 22. No new database service was installed. Current implementation remains local-only with a writer guard and indexed object/link payloads.

## Realistic scenarios checkpoint
Added source-driven variants for the other nine preserved operations under Customize > Examples. Runs read actual scoped seed originals and saved records, bind scenario version 1 and immutable source references, and generate current source-backed files. Historical checks use explicit dates; revised original content changes comparison output; Plan uses 12 real local source snapshots; RTI retains a missing answer. Two scenario service tests pass with all five formats per operation. Source-dependent review requires verified originals; API read/export/mutation now rechecks case scope. Fixed stale builder bootstrap responses overwriting edits. SQLite flagship browser passed; the earlier builder run exposed that bootstrap race and is being rerun. New nine-scenario/browser suite is active.

## New ten-scenario browser checkpoint
The clean 11-test run passed in 1.5 minutes: six-stage builder, five-scene flagship and all nine new source-driven examples. Every scenario opened actual cited originals, survived refresh and generated all five formats; unrelated actors were denied derived exports/mutations. Outgoing page content is now inert during route transitions, preventing source-preview clicks from being lost. Current application code is still being extended for remaining navigation/connector/rule requirements; this is not full-spec completion.

## Connected workspace controls
Added scoped Approvals, People and Reports pages and grouped secondary sidebar navigation. Added server-enforced Work Pause/Resume/Cancel that retain documents and history. Added UI safe restart for guided runs: creates a new case namespace, pauses the prior run, retains originals/unrelated work, and retries return the same new run. Three guided service tests pass, including safe restart. The prior complete npm test run passed 55 tests; the newly added restart test will be included in the final run. Remaining work includes connector registration, advanced builder rules and detailed scenario interaction coverage before declaring full specification completion.

## Role and source-system integration
Added named section review and separate authority approval to template/realistic Work, with source-bound review, correction tasks on return, immutable approval history and current-role enforcement inside one transaction. Added server-resolved Work role selector. Added Legacy system registry/configuration, actual sample health checks, disabled import enforcement, mapping versions and nonexecuting HTTP entries. Added private scoped notebooks with original citations; revoked source entries are filtered. TypeScript passes. New run-policy and Legacy registry service tests pass; named-role/secondary-page/legacy browser tests are active. Advanced builder options and exact remaining scenario scripts remain pending; no full-spec completion claim.
