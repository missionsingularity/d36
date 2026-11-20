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

