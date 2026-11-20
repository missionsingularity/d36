# Ontology upgrade verification

20 November 2026. This is an incremental report, not a completion claim.

| Acceptance area | Result | Actual evidence |
|---|---|---|
| Existing ten workflows and exports | PASS (baseline) | 34-test full Chromium run before ontology changes; rerun pending |
| Intake validation and optional original | PARTIAL | Working form; follow-up test selector fixed; browser rerun pending |
| Persistence, stable ID, hashes, revisions | PASS | Existing domain/browser lifecycle and 33 current service tests |
| Typed relationships and multiple collaborators | PASS (domain) | New link/member/lead/scope tests; browser pending |
| Scoped duplicate candidates and human link decision | PASS (domain) | Suggestions filtered by access; explicit link saved without merge |
| Overlapping writers | PASS (local lock) | Exclusive file lock rejects overlap without mutation; failed transactions release lock |
| Exact-version review, return, closure and reopen | PASS (existing local lifecycle) | Prior browser lifecycle; current service tests. Expanded execution/ATR/appeal gates still pending |
| Three source adapters, idempotent source snapshots and quarantine | NOT TESTED / NOT IMPLEMENTED | Existing fixed-format CSV import is a separate simpler pathway |
| Follow-ups, scheduled checks and escalation | PARTIAL | Existing evidence request/resume; richer persisted engine pending |
| Independent appeal workflow and proof-gated dispatch/ATR | NOT IMPLEMENTED | Existing internal appeal marker is not the required separate lifecycle |
| Typed case Chat tools and shared persistent thread | PARTIAL | Existing local queries, templates and Work links; expanded interpreter pending |
| Current production build and full browser regression | PENDING | Baseline build passed; ontology changes require rerun |

No source systems or AI provider are connected. Records and roles are local demonstrations. See PROGRESS.md for checkpoint commands and later results.
