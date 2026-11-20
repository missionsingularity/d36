# BrahmaGPT progress

Date: 20 November 2026. Official repository: missionsingularity/d36. Latest prior local commit: 4b6f0f9. The commit containing this file records the upload extraction milestone. No remote push has succeeded; known blocker is HTTP 403 for slevel7. No repeated push attempted.

Completed: original ten deterministic government-work scenarios, synthetic sources, exports, reviews, tasks and local persistence. Persona settings and persistent appearance are implemented. Current increment adds PDF/DOCX text extraction and upload-content search using installed dependencies.

Website: development server on http://127.0.0.1:3000 returned HTTP 200. It is held in a persistent terminal session.

Last tested: TypeScript passes. 22 engine tests pass, including actual PDF/DOCX extraction and stable original bytes. Chromium passed actual Word upload, extraction preview, refresh persistence, document content search and workspace content search. The first run exposed a corrupted label character, corrected before the passing rerun.

Current task: verify extraction via the normal upload and search UI.
Next immediate task: source-restricted research notebooks and their persisted sources, followed by the attached MVP's source-grounded question flow.

Known limits: scanned PDFs require OCR/manual transcription. General model conversation requires provider configuration. Research notebooks and department selection are incomplete. The earlier ten-workflow catalogue differs from the newer MVP capability list; retain those working workflows while adding the new capability gaps.

## Persistent typed chat milestone

The supplied master prompt (sections 0–16) was read completely. The named d36_codex_pack folder is absent; the supplied D-drive prompt and screenshot files were used, with the earlier Tasks screenshot as the third reference.

Typed New Chat now calls the server and saves independent conversations. Follow-up questions survive refresh and are listed in recent history. Supported deterministic queries search authorised source paragraphs and list actual persisted tasks/overdue work and pending approvals. Citations open exact source excerpts. General model configuration remains unavailable and is stated explicitly. New Chat now sits above Projects; the wide-screen mode switch is centred.

Verified: TypeScript passed and the Chromium typed-query/citation/follow-up/refresh/unsupported-query test passed. Homepage returned HTTP 200 at http://127.0.0.1:3000. No GitHub push attempted because the prior write-access blocker has not changed.

Next slice: durable project membership and conversation-to-work links, then grievance CRUD/lifecycle, server-issued demo sessions, optional provider adapter, legacy import and notebooks. SQLite migration and five-role approval scope remain open; current data is preserved in the existing JSON store.

## Session and project-member slice

Permission resolution now uses a server-issued opaque HttpOnly/SameSite demo session stored on the server. The labelled persona switcher issues a new session. The old role cookie is ignored. Anonymous direct source/export requests require a session. This remains local demonstrator identity, with the existing three personas; five-role approval separation is pending.

Verified Chromium: existing HTTP permissions/upload/export checks, chat persistence, reviewer restriction/restoration, and a forged role-cookie denial all passed. Project member add/remove, avatar stacks, per-member project labels and last-owner protection are implemented, with Chromium verification passed for adding three users, refresh persistence, removal and last-owner denial. The picker received an explicit accessible label after the initial browser attempt exposed the missing label. Project roles currently describe the shared local project membership and do not yet implement full department/membership isolation.

Conversation-to-work association now links a typed thread to one persistent illustrative office-note run. Repeated Open in Work reuses the run, and the Chat switch returns to the same conversation. The office note uses the existing synthetic case workflow and its evidence set; arbitrary free-form generation is not configured. Follow-up browser test pending at writing. Service regression: 23 passed. Production build passed before the final association change, followed by a passing typecheck.

Full regression attempt identified test isolation issues: a permission test left guest source access revoked, a chat assertion assumed no earlier pending reviews, and the newly labelled dialog made a non-exact link selector ambiguous. The tests now restore the deliberate restriction and assert actual returned review state, with an exact textbox selector. The full run was stopped for a clean rerun after these corrections; no overall PASS is claimed for that interrupted run.

Regression follow-up: the complete 30-test run reached 28 passes and 2 failures. RTI Work was still loading at the five-second assertion deadline during concurrent compilation. The other failure was the English welcome assertion after the settings test intentionally saved Hindi without restoring it. The settings test now restores its changed preferences; Playwright render expectations allow up to 15 seconds while retaining the overall test deadline. A fresh full rerun is in progress. Final production build passed.

Remote check: fetch confirmed compatible official history at 09680e5. A single dry-run normal push succeeded on 20 November 2026, so publication access is now available. Light/dark Customize captures were visually inspected, including a fix for contrast flashing during theme transitions. Final full-suite result is pending at writing.

## Verified checkpoint, 20 November 2026

Final clean regression: 30 Chromium tests passed in 4.3 minutes. This includes the ten existing workflow launches, every-citation/five-format output checks, typed chat/history, conversation-to-work reuse, forged role-cookie denial, project members, settings, theme persistence, uploads, proof gates and responsive overflow checks. TypeScript passed; 23 service tests passed; production build passed. Light/dark Customize screenshots were captured from the live site and inspected. Port 3000 returned HTTP 200.

GitHub access is restored. The normal fast-forward push to missionsingularity/d36/main succeeded through e94980b, publishing a5d2e4f, d2d7471, 16ecc2c, dbd3328 and e94980b. This report is saved in the subsequent checkpoint.

The full master-prompt scope is still incomplete. Next implementation priority is grievance CRUD/inbox and a guarded lifecycle with distinct Approver identity, followed by scoped project membership authorization and custom task CRUD. SQLite migration, remote provider adapter, notebooks and reversible legacy import remain pending. Existing JSON records and all prior functionality are preserved.

## Plain-language interface, 20 November 2026
Shortened navigation, dialog labels, profile and permission explanations, conversation guidance and all ten task descriptions. Removed overlapping labels such as Meetings & minutes and Confirm and save. Exact source passages and formal output content are preserved. TypeScript and 23 service tests pass. Browser regression is in progress; one citation-modal check needs a focused rerun after edits made during the test run. Existing tsconfig.json working changes are preserved.


Plain-language verification complete: typecheck and 23 service tests pass. Browser suite: 29 passed, one citation-modal check failed during concurrent live edits; its focused unchanged-code rerun passed, including every citation and all five exports for workflow 4. All 30 checks have successful results across these runs, not a clean single full run. Site returned HTTP 200 on port 3000. Wording checkpoint 7999cc2 successfully pushed to official main.


## Grievance slice 1 — domain and API
Read the full grievance directive. Added backward-compatible grievance state, seeded synthetic cases, scoped demo roles, validated lifecycle, versioned proposals and evidence, audit hash chain, CSV/PDF exports and atomic legacy import/reversal. Seven independent domain tests and typecheck pass. UI integration and HTTP/browser tests are next. Existing tsconfig.json changes preserved. This slice is partial until the interface and journeys are verified.


## Grievance slice 2 — connected case workspace
Projects now opens the persisted grievance dashboard and register. Added intake/drafts, seven dossier tabs plus scoped local chat, role controls, evidence inspection, versioned decisions, closure/reopening, tasks, reports, policy/team settings and fixed-format CSV import. Initial Chromium run passed all three new journeys, including complete lifecycle, HTTP denial/import and viewport checks. Tightened theme test to assert actual persisted theme; a full rerun is next. Work links use case-scoped exports; generic chat excludes case data. Typecheck and all 30 combined service tests pass. No unrelated tsconfig.json changes staged.


## Grievance slice 3 — access and browser verification
All four new Chromium grievance journeys passed in the combined regression: full processing/reopen, HTTP scope and import, asserted light/dark responsive routes and keyboard tabs, and case chat-to-Work with original previews, scoped exports and explicit existing-Work links. Production build passed after removing a non-route helper export rejected by Next.js. Remaining old workflow regressions are still running. Operation guide and verification matrix added. Known demo limits: single-process JSON, no production identity/integrations, Latin-only PDF; Unicode TXT remains available.


## Ontology upgrade audit
Official main/origin preserved. Read the complete available root ontology prompt (sections 0�20); the specifically named pack, accompanying workflow specification and pack screenshot folder are absent from the repository and supplied build-kit directory. Requested their location while continuing safe work from the available prompt. Existing 34-browser regression and final production build passed. Interrupted follow-up: four grievance tests passed; intake validation test failed because its alert selector included Next.js's hidden announcer. Scoped the assertion to the actual form alert. Existing intake/CSV refinements and generated config changes retained. Next: backward-compatible typed ontology, team grants and official-status separation.


## Ontology slice A/B checkpoint
Pack appeared after retry. The pack master hash matches the fully read root prompt; read its supporting workflow specification and prior master and inspected all three screenshots. Added backward-compatible typed case/issues/document-version/task/draft/user relationships, scoped duplicate suggestions with human review, case member roles and lead protection, explicit internal/non-official label, structured error envelopes and an exclusive writer lock. Existing config/reference files preserved and local pack ignored. Typecheck and 33 service tests pass. Browser check next; three richer legacy adapters, follow-up engine, controlled execution, independent appeal and typed chat remain pending.


## Ontology slice C — follow-ups
Added persisted requests with recipient, accountable owner, due/escalation dates, reminder policy, idempotency keys, verified reply references and proof-linked dependency release. API loads generate persisted due/escalation reminders without external delivery. Review rejects outstanding follow-ups. Typecheck and 34 service tests pass. Browser run found two selector ambiguities and a creator-upload permission gap during initial registration; corrected them and started focused reruns. No full-regression claim yet.


## Ontology legacy slice checkpoint
Added three local CSV/JSON adapters with editable mapping, real sample downloads, row-level quarantine, canonical source IDs, preserved historical receipt/disposal, idempotent import keys, retained stale snapshots, conflicts and independent reconciliation. Source-to-case associations require explicit scoped action. Typecheck and all 36 service tests pass. Browser tests still require stable reruns: one navigation/reload timing assertion corrected; member dialog works in direct Chromium inspection. Do not interpret in-progress test failures as verified module completion.


## Ontology slice D — controlled execution and appeals
Added separate persisted ATR/response packets, independent packet review, manual outbox, execution proof, submission proof, independent acknowledgement, feedback and a separate appeal workflow. Closure now returns explicit blockers and cannot jump from approval to closed. Exact proposal/evidence hashes bind the packet and execution. Added custody/reviewer/authority/appellate/auditor demo identities without production claims. Typecheck and 37 service tests pass. Browser journey updated to include all proof gates; stable focused verification running. Remaining: richer typed case Chat, full evidence checklist/conflict UI, source-state polish, final acceptance report and full regression.


## Ontology slice F — typed case tools
Added persistent case/global conversations with scoped retrieval, actual verified-source excerpts, staged task/intake/follow-up/draft/review/closure commands and explicit confirmation. Confirmed tools reuse the same state-level action functions as Work; draft + Work association commits atomically. Replays do not duplicate versions; stale confirmations receive 409. The root composer routes grievance commands to the case backend and case Chat/Work switches preserve case context. Typecheck and 39 service tests pass. Execution/closure, member controls and three-source import browser journeys passed before this slice. Typed-agent browser checks and independent appeal branch are next.


## Ontology evidence and appeal checkpoint
Added case-specific document requirements with recorded basis, not-applicable determinations, preserved source revisions, independent conflict review and exact-version approval request objects. Non-text PDFs now return no fabricated page quotation and show OCR required. Added authority delegation and specialist case grants. Historical imported disposal can be internally finalised only with verified source ATR, proof and completed appeals; it does not write back to the source. Typecheck and 42 service tests pass. Next: typed-agent/appeal browser journeys, final regression/build, reports and remaining UI integration.


## Integration checkpoint before full QA
Connected case documents and full-text excerpts to Documents, case tasks to My Tasks, case activity to Notifications and scoped case metadata to workspace search. Added task editing/collaborators/dependency-cycle checks, typed assignment/source association, specialist routing and referral gates, explicit draft rejection, source-change invalidation and current-grant revalidation. Local source payloads are retained with hashes; hidden source snapshots and import rows are filtered by scope. Department objects and richer case-history exports added. Typecheck and 47 service tests pass. Typed intake/task/Chat-Work and historical source appeal browser journeys passed in the focused run. Feature code is frozen for full regression and build; optional live providers/government integrations remain unconfigured.


Final QA: production build passed. Full 41-browser run found a Chat-to-Work/tab navigation race; case tabs now use persistent routes and retain the current dossier during same-case transitions. Added architecture, API, import and reviewer guides. Full rerun pending. A restricted service-test invocation failed in Node userInfo with ENOMEM before tests; rerunning outside that restricted process environment.

QA fixes: case route transitions no longer remount the dossier for each tab, preventing lost follow-up forms. Notifications now expose stable record associations for precise navigation testing; legacy acceptance permits already-imported canonical samples from the appeal branch. Added real UI evidence checklist/revision/full-text/task-editor regression. 47 service tests passed after rerun. Latest build passed before these small UI fixes; final build and browser rerun remain required.

Live Chromium verified the port-3000 overview in light and dark with no page errors; both screenshots inspected. Final production build passed. Full browser regression initially 36/41; clean rerun stalled on an appeal form detached during tab navigation. Stopped that test process, preserved the live server, removed optimistic tab rendering so interactions await committed routes, and launched focused case/evidence/navigation regression. TypeScript passes. Reports retain partial appeal/retry limitations explicitly.

Transition correction: Next route changes were remounting case forms even after preserving the inner key. Case tabs now switch locally and remember the section; explicit deep links still open their sections. Focused full lifecycle and overdue follow-up passed (19.9s and 4.1s). Interrupted runners caused conflicting artifacts; verified orphan QA processes/listener were cleared, preserving port 3000. One clean 42-test full run is active; no feature edits during it. Task assertions now target the intended record rather than assuming an empty personal task list.
