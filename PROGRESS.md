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
