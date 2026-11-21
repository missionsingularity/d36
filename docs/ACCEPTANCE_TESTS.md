# Acceptance evidence

Run `npm.cmd test`, `npm.cmd run typecheck`, `npm.cmd run build`, and `npm.cmd run test:e2e`. Live Gemini requires `.env.local` configuration and a separate manual request. Final test outcomes are recorded in IMPLEMENTATION_PROGRESS.md.

| ID | Evidence / scope |
|---|---|
| AC01 | Offline multi-step Alpha incident → policy → draft → approval flow; browser and service tests. Arbitrary live instructions await a key. |
| AC02 | Official Gemini SDK structured plan, strict enum/argument schema, eight-step bound; unsafe/oversized plan rejection tested. Live service unverified without key. |
| AC03 | Actual FTS5 records, source IDs and previews; HR permission filtering tested. |
| AC04 | Actual incident/asset/project links; completion, eligibility, leave and dependency calculations tested. |
| AC05 | Persistent draft versions and governed task proposals; real document outputs tested. |
| AC06 | Independent authorized reviewer, exact version, return comments; stale version rejected. |
| AC07 | Transactional local procurement and leave changes; unique receipts and repeated execution tested. |
| AC08 | Immutable versions, author, reason, timestamp and audit events; revision survives reload. |
| AC09 | IT, Projects and HR use one database, user directory and services. |
| AC10 | Missing-key mode truthful; schema failures and failed tool events handled. Real quota/network failures require live/manual verification. |
| AC11 | Local demonstration requires no third-party enterprise integration. Gemini is optional until configured. |

Not every detail of the full vision is complete. See KNOWN_LIMITATIONS.md for the bounded prototype scope.
