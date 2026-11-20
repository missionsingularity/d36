## Current checkpoint — 21 November 2026

This section supersedes the historical entries below. Official remote is `https://github.com/missionsingularity/d36.git`, branch `main`. Published checkpoint `62cc07d` pushed successfully without rewriting history. The final test fixes and status updates are being saved as a follow-up checkpoint.

The existing Next.js app, persistent SQLite store and ten deterministic workflows are preserved. The five-scene pension case, grievance lifecycle, local synthetic imports, role-scoped records, evidence, approvals, appeals, tasks, Chat/Work, documents and exports are connected. All ten workflows have browser-tested results and five-format downloads. The application uses synthetic data; local personas, approvals and dispatch are demonstrations and no government system or external AI is connected.

The website is running at `http://127.0.0.1:3000`; homepage and health checks return HTTP 200. On 21 November, `npm test` passed 60/60, TypeScript typecheck passed and the production build passed. The 59-case Playwright run had 56 passes and three test failures caused by shared-state/assertion issues; all affected tests passed in focused reruns. This gives individual passing evidence for all 59 cases but not one aggregate 59/59 run. Details are in `docs/DEMO_TEST_RESULTS.md`.

Remaining limits: no live AI, government, email or signature integration; no scanned-document OCR or multilingual PDF rendering; no formal accessibility audit. The dev server is a local single-process demo, not production infrastructure.

Reviewer guides: `docs/GRIEVANCE_DEMO.md`, `docs/GRIEVANCE_ARCHITECTURE.md`, `docs/GRIEVANCE_API.md`, `docs/LEGACY_IMPORT_GUIDE.md` and `docs/DEMO_WALKTHROUGH.md`.---

# BrahmaGPT project status

Updated 19 November 2026. Base checkpoint `d098a46` on `main`. The commit containing this report is the subsequent local checkpoint (`git log -1 --oneline`). Official remote is `https://github.com/missionsingularity/d36.git`. Publication remains blocked by the previously confirmed GitHub HTTP 403 for `slevel7`. This verification run made no push attempts.

## Demonstration

Run `npm.cmd run dev` from the project directory. The standard local URL is `http://127.0.0.1:3000`. The pre-existing process on 3000 timed out during this run. The final production preview returned HTTP 200 on `http://127.0.0.1:3002`. Chromium verification ran against a fresh isolated Next.js instance on port 3100.

New Chat, Projects, Customize, Documents, My Tasks, Profile, and the shared Chat and Work record are implemented. Grievance is the shared synthetic case context. Outreach opens from Customize or Projects. The ten workflow journeys use the existing deterministic engine and local store. Review, evidence, task dependencies, document version history, scenarios, and outreach amendment checks are exercised with synthetic records. Sharing displays a copyable local record URL even when clipboard access is denied. Notifications link to the corresponding record and decision or activity view.

## Verification

- `npm.cmd test`: 18 passed, including all 15 business-state acceptance cases and document generation/parsing checks.
- `npm.cmd run typecheck`: passed using the standalone TypeScript configuration.
- `npm.cmd run build`: passed using an isolated Next.js output directory.
- Initial Playwright suite: 6 passed. All ten workflows launched through the UI, retained the record across Chat and Work, opened citations, and generated downloadable PDFs. Review, versioning, task proof, scan correction, chair confirmation, outreach, amendment holds, and viewport overflow were covered. The HTTP test checked role restrictions, source revocation, cross-origin rejection, original upload preservation, and Office/TXT download responses.
- Engine tests parsed the generated PDF, DOCX, XLSX, and PPTX structures and checked TXT content. This was structural validation, not visual inspection of every exported file.

- Follow-up Chromium runs passed the ten predefined-question checks and the New Chat, hover preview, local sharing, and notifications journey. The first navigation attempt needed a longer wait for the initial route compilation.

## Workflow verification checkpoint

The workflow QA code checkpoint is 0043aa2, followed by the final follow-up changes and report in the latest local commit. All ten browser launch/evidence/export cases passed. The expanded run had one sharing timing failure; the patch passed targeted reruns. TypeScript, production build, 20 engine tests and all three focused Chromium regressions passed. The development homepage returned HTTP 200 on port 3000. See [WORKFLOW_TEST_REPORT.md](WORKFLOW_TEST_REPORT.md) for the ten-workflow matrix, fixes, browser evidence, sample outputs and unresolved coverage.

## Remaining limitations

Demo personas and approvals are simulated. Sharing is local and sends no email. Outreach is simulated and makes no external contact. PDF/DOCX uploads preserve original bytes without binary extraction. PDF uses Latin fonts, with DOCX/TXT for complete multilingual passages. Production authentication, live integrations, and multi-process persistence are outside the demo scope. Responsive checks cover overflow at 1440, 1280, and 768 pixels. A formal accessibility audit has not been performed.

## Account, preferences and permissions correction

Account and Preferences now use separate forms with validated partial saves. Profiles are stored per demo persona, preserving existing officer settings. Contact information and designation are editable. Language, time zone, date format and notification preferences persist independently. Guests can save their own profile preferences while remaining read-only for work records. The reviewer can restrict or restore ordinary source access; base restricted-source rules remain enforced.

Typecheck and all 21 engine/settings tests passed. Two Chromium settings journeys passed, covering save/refresh, persona isolation, guest profile saving, source restrictions, restoration and HTTP source denial. Preference selectors now have explicit accessible names. The final Chromium rerun passed both journeys with the busy-state protection during persona switching.

## Theme navigation fix

Appearance now lives in the root layout provider. Saved appearance is applied before page rendering, and page mounts no longer overwrite it with the default. TypeScript passed. Chromium verified dark appearance across New Chat, Projects, Customize, Documents, My Tasks and Profile, including reloads and switching back to light through the overflow menu.

## Navigation and action-flow refinement

Work records now remember the active tab after navigation and refresh, and the global Work switch returns to the latest permitted record. Route changes close transient menus and clear outdated errors. The overview shows a state-specific next step. Confirmation dialogs provide a saving state, lock their controls until a mutation finishes, and prevent dismissing an in-flight confirmation. A synchronous guard prevents overlapping mutations. Stale refresh responses cannot replace a newer workspace response. Page transitions respect reduced motion.

TypeScript passed. Three Chromium regressions passed: persistent record/tab navigation, single-submit locked confirmation, and unsaved draft preservation after a denied save. The live homepage returned HTTP 200 on port 3000.

## Latest verification and publication

20 November 2026: the complete clean Chromium suite passed 30 tests. TypeScript, 23 service tests and the production build passed. Typed local chat, persisted conversation follow-ups, conversation-to-office-note links, server-issued demo sessions and persisted project members are now implemented and tested. The website is running at http://127.0.0.1:3000.

GitHub write access is now available. A normal fast-forward push to missionsingularity/d36/main succeeded through e94980b. The preceding HTTP 403 statements above describe historical checks.

Remaining master-prompt work includes grievance CRUD and full lifecycle, scoped department/project membership enforcement, separate approver/admin roles, SQLite migration, configurable remote provider, notebook sources and reversible legacy import. The current project-member roles are local labels with role-based mutation checks. They do not yet provide department isolation.

## Ontology upgrade in progress
The grievance CRUD/lifecycle module is now implemented and passed a 34-test browser baseline plus production build. New typed ontology/team/duplicate features pass typecheck and 33 service tests; browser verification is pending. Official main pushes succeeded through c174cea. Pack references remain local. Full ontology execution/appeal/source-adapter/typed-agent requirements are not yet complete.

