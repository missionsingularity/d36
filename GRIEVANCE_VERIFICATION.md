# Grievance verification

Updated 20 November 2026. Implementation checkpoints: `5b3b978` (domain/API), `cee9374` (connected UI). Normal pushes to `missionsingularity/d36/main` succeeded. A final regression/build is in progress; this report will be updated from actual results.

| Requirement | Result | Evidence |
|---|---|---|
| Validated draft, edit, one-time registration, stable ID and reload | PASS | Domain test and Chromium full lifecycle journey |
| Supervisor assignment and assigned officer casework | PASS | Domain test and Chromium lifecycle |
| Missing-evidence request, original bytes/hash, independent verification and resume | PASS | Domain test, browser original download/content check |
| Proposal, independent role, stale version and self-approval denial | PASS | Domain tests assert 403/409 and persisted versions; browser return/revise/approve |
| Closure requires current approval, action taken and follow-up | PASS | Domain and browser lifecycle |
| Reopen preserves original closure, evidence and history | PASS | Domain hash-chain checks and browser reload |
| Cross-department/nonmember search, direct case, history/PDF/ack/file denial | PASS | HTTP browser assertions and domain scope checks |
| Filtering, CSV contents, due dates and report counts | PASS | Domain report/filter tests, HTTP CSV contents and browser filter |
| Atomic import, duplicate validation, safe reversal and later-action denial | PASS | Domain tests and HTTP import/reversal |
| Case chat → Work, real scoped exports and two-way links | PENDING | Added focused browser journey; full suite running |
| Evidence text previews | PENDING | Added scoped preview and browser journey; full suite running |
| Both themes at 1440/1280/768/390, keyboard tabs | PENDING | First viewport run passed; corrected test now asserts theme after each navigation |
| Existing ten workflows, chat, members, settings and exports | PENDING | Full regression running |
| TypeScript | PASS | `npm.cmd run typecheck` |
| All service tests | PASS | `npm.cmd test`: 30 passed |
| Production build | PENDING | Isolated `.next-build-grievance` build running |
| Running local case page | PASS | HTTP 200 from `http://127.0.0.1:3000/projects/grievance` |

See [operation and permission guide](docs/GRIEVANCE_OPERATIONS.md) for roles, policy grounding, reproduction and local security limitations. No production authentication, government integration or delivery is claimed. Formal accessibility audit and non-Latin PDF rendering are not verified.
