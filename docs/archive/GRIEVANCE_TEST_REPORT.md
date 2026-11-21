# Grievance acceptance report

20 November 2026. Final browser regression is in progress. This is not an unconditional completion claim.

TypeScript passed. All 47 service tests passed (23 existing engine/settings/export and 24 grievance). The isolated production build passed before the final case-tab correction; a final build is required. One restricted test invocation failed before execution with Windows uv_os_get_passwd ENOMEM; the subsequent run passed all 47.

The initial 41-browser run found a case transition race and test assumptions about shared samples and notification ordering. Case tabs now retain the dossier across route changes. Import tests recognise canonical samples imported by the appeal journey. Notification tests select the actual Work association. The clean rerun will be recorded below.

| # | Acceptance | Actual result and evidence |
|---|---|---|
| 01 | Draft, original, stable ID, persistence | PASS: service reload and browser intake/refresh with internal-only disclaimer |
| 02 | Invalid intake without corruption | PASS: domain validation and browser missing-field checks |
| 03 | Canonical external ID deduplication | PASS: source service tests; browser repeated import |
| 04 | Older snapshot cannot replace newer | PASS: out-of-order snapshot/reconciliation service test |
| 05 | Historical disposed source preserved | PASS: domain and complete imported-case appeal browser journey |
| 06 | Bad rows quarantined, valid rows saved | PASS: mixed import checks exact counts, submitted payload and hash |
| 07 | Explicit source link, no silent merge | PASS: scoped source association, duplicate decisions and confirmed typed source tool |
| 08 | Lead/collaborators and scope checks | PASS: domain and browser members; duplicate, wrong-scope and last-lead rejection |
| 09 | Scoped case/document/search/export/chat | PASS: domain and direct HTTP 403; thread denied after scope change |
| 10 | Original bytes and immutable revisions | PASS: byte/hash checks and revision/evidence invalidation; expanded UI journey added |
| 11 | Scan uncertainty without fake quotations | PASS: blank PDF has no invented page quotation and marks OCR required |
| 12 | Proof-linked follow-up/dependency | PASS domain; only linked dependency releases. Browser rerun pending transition fix |
| 13 | Persisted internal reminders | PASS domain; overdue/escalated intervals and externalSent=false; browser rerun pending |
| 14 | Conflicting sources retained and held | PASS: independent reconciliation and invalidation tests; neither original overwritten |
| 15 | Return V1, revise V2, exact approval | PASS: full browser lifecycle and domain version checks |
| 16 | Self/unrelated/stale approval denied | PASS: server role/scope and 403/409 assertions |
| 17 | Approval is not dispatch or closure | PASS: packet/proof gates in domain and full UI lifecycle |
| 18 | Honest outbox and unavailable connector | PASS: PREPARED_NOT_SENT before proof; remote-send returns 503 without false ACK |
| 19 | Premature closure lists blockers | PASS: domain and browser leave state unchanged |
| 20 | Verified disposal and closure | PASS: complete UI receipt-to-closure and imported-source finalization branches |
| 21 | Independent versioned appeal | PARTIAL: independent review, immutable decision v1, proof and finalization pass. No decision revision/further-evidence branch or separately versioned communication editor |
| 22 | Reopen preserves history | PASS: retained closure/hash history and browser reload |
| 23 | Grounded typed current-case queries | PASS: real owner/status/extracted excerpts and persisted offline tools |
| 24 | Confirmed Chat creates shared records | PASS: typed intake/task/draft/follow-up services and UI Chat-to-Work/export; final transition regression pending |
| 25 | Retry/double-click safety | PARTIAL: uploads/tools/imports/keyed outbox idempotent; UI prevents duplicate saves. Repeated approval safely returns stale/conflict rather than replaying its prior success |
| 26 | Themes, responsive layout, navigation | PASS first full run: both themes at 1440/1280/1024/768/390, keyboard tabs/avatars. Final transition rerun pending |
| 27 | Credential-free local adapters | PASS: three actual CSV/JSON adapters, local-file labels, no government outbound calls |
| 28 | Original ten workflows/settings/exports | PARTIAL pending clean regression: service/export tests pass; nine five-format browser cases passed, workflow 9 stalled on initial loading while code was changing |

Data and identities are synthetic. Manual proof is independently reviewed staff-attested demo evidence, not a connected portal acknowledgement. AI is offline/deterministic. The exclusive JSON writer lock is not a multi-host production database. OCR, non-Latin PDF fonts, production identity, malware scanning and live government/email/AI integrations remain unavailable. Office formats are structurally parsed, not visually certified in every Office application. Formal accessibility certification and exhaustive manual testing of every role/control combination have not been performed.

Commands: npm.cmd run typecheck; npm.cmd test; npm.cmd run build; npm.cmd run test:e2e. Browser data on port 3100 is isolated from developer data on port 3000. Traces, screenshots and output samples remain ignored in test-results and playwright-report.
