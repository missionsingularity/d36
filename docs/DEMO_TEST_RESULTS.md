# Customize v2 test results

Updated 21 November 2026. No blanket specification-complete claim. This report supersedes the provisional status below.

## Executed flagship

- `npx.cmd tsx --test tests/guided-demo.test.ts`: PASS, entire governed receipt-to-closure lifecycle, retained versions, outsider and wrong-role denial, stale version rejection, premature closure blockers and five generated formats.
- `npx.cmd playwright test tests/browser/flagship.spec.ts`: PASS, 1 test, 30.0s total. Clicked Customize Try example, opened actual original preview, changed six demo roles, reconstructed, attached/verified service original, completed task, saved note v2, obtained separate section review and approval, dispatched locally, encountered expected closure denial, acknowledged/followed-up/closed, refreshed and downloaded PDF/DOCX/XLSX/PPTX/TXT. No browser page errors. Screenshot: ignored `test-results/flagship-closed.png`.
- First browser attempt failed because a test selected both the application alert and Next's route-announcer alert. The assertion was scoped to the demonstration workspace and the rerun passed.
- Initial export test found upper-case format arguments; corrected to the existing export API's lower-case contract. All formats subsequently generated successfully. PDF was parsed; Office formats retain existing structural regression coverage.
- Live `/customize` returned HTTP 200 after restarting the stalled development server. Server ready at `http://127.0.0.1:3000`, persistent terminal session 86222.

## Ten scenarios

| Scenario | Current v2 result | Evidence / remaining work |
|---|---|---|
| 01 Compare | PASS | Actual sources opened; result and citations checked; five export formats downloaded |
| 02 Historical applicability | PASS | Selected-date result and citations checked; five exports downloaded |
| 03 Digitise | PASS | Uncertain record and review gates tested against actual sources; five exports downloaded; OCR is not claimed |
| 04 Pension grievance | PASS | Five-scene persisted case, independent review and approval, local dispatch receipt, follow-up and closure tested; five exports downloaded |
| 05 Plan | PASS | Source-backed plan and linked tasks checked; five exports downloaded |
| 06 Office note | PASS | Versioned note, review and approval checked; five exports downloaded |
| 07 Amendment | PASS | Exact source-linked impact check and affected work handling tested; five exports downloaded |
| 08 Meeting | PASS | Chair-confirmed source action and task creation tested; five exports downloaded |
| 09 RTI | PASS | Pointwise supported, partial and unavailable answers checked; five exports downloaded |
| 10 Outreach | PASS | Synthetic, approval-gated outreach draft generated and reviewed; no real contact made; five exports downloaded |

The ten output cases and nine additional realistic scenario variants were exercised in Chromium against isolated local data. The master output suite verified citation previews and PDF/DOCX/XLSX/PPTX/TXT downloads. Local personas, approvals and dispatch are simulations; no government or external service was contacted.

## Latest regression — 21 November 2026

- `npm.cmd test`: 60 passed, 0 failed.
- `npm.cmd run typecheck`: passed.
- `npm.cmd run build` with isolated `.next-build-final`: passed.
- Playwright full run executed all 59 tests: 56 passed and 3 failed due test assumptions/state carried across a shared local store. After fixes, the two settings tests and three workspace tests passed together, the dispatch test passed separately, and the grievance/ontology/legacy tests passed focused reruns. Every browser test in the 59-case suite therefore has a passing run, but the aggregate was not rerun to a single 59/59 result.
- The dispatch test now waits for the evidence row and skips a duplicate verification when a prior run already recorded it. The settings test restores English after checking the selected language, so later workspace checks start from a known state.
- The full Playwright wrapper sometimes hangs after printing results; it was interrupted during idle teardown. Node emitted expected SQLite experimental and environment color warnings. No passed browser journey reported an app page exception.
- The user-facing dev server remains running at `http://127.0.0.1:3000`; the homepage and health route returned HTTP 200 after the tests.

Known limits: no live AI/government/email/signature integrations, scanned-document OCR, non-Latin PDF rendering or formal accessibility audit. See `IMPLEMENTATION_STATUS.md` for scope notes.

## SQLite-backed realistic scenario verification
Actual command: npx.cmd playwright test tests/browser/scenarios.spec.ts tests/browser/builder.spec.ts tests/browser/flagship.spec.ts. Result: 11 passed, 1.5 minutes. Covers every one of the ten scenarios (flagship plus nine source-driven operations), actual source opening, persisted IDs, five output downloads, PDF parsing and forbidden derived export/mutation. Initial preview failures were outgoing-route interaction races; controls now become inert during navigation and tests await the destination URL. All eleven passed on rerun. Service tests additionally prove changed source versions and check dates change results, while missing verification blocks review. The exact expanded v2 business scripts and complete connector/builder options still require further work, so the prior PARTIAL entries remain appropriately scoped.
