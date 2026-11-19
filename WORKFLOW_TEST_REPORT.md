# BrahmaGPT workflow verification

Environment: Windows, Next.js, and Playwright Chromium. Browser tests use port 3100 with isolated synthetic data. Baseline app checkpoint: 48df035. Results below distinguish browser journeys, engine acceptance, and remaining scope.

## Common test steps and results

For each catalogue entry, open Customize, launch the fixture, confirm the actual launch request and returned work record, assert the question and structured findings against the visible page, and open every displayed citation. Compare the highlighted passage against the source registry. Switch to Work, refresh, download each format, parse the files, and go back to the same Chat. The first expanded Chromium run passed all ten journeys. The final rerun is recorded below.

Each case produced a work screenshot and PDF, DOCX, XLSX, PPTX and TXT downloads. Sample artefacts are kept under ignored test results, not in Git. PDF text extraction on all ten browser downloads confirmed the draft status, evidence appendix and not-issued footer. The outreach PDF contains the multilingual fallback. DOCX and TXT preserve Hindi and Assamese script. This is not a visual Office-rendering review.

## Scenario-specific results

| Workflow | Expected | Observed / evidence | Remaining verification or scope |
|---|---|---|---|
| 1. Circular comparison | Multiple dated sources, unresolved conflict, exact excerpts | Browser launched and opened every displayed citation. Acceptance 01 verified both review sequences and the conflict. Report downloaded and parsed. | No unsupported precedence decision is part of the demo. |
| 2. Historical applicability | Apply dated guidance and exclude later rules | Browser launched using the default historical date. Acceptance 02 verified the April source and non-retrospective note; engine rejects impossible dates and cites nothing for pre-source dates. | Alternate date submitted through the browser was not separately checked. |
| 3. Scan verification | Preserve ambiguity, require officer correction and independent review | Browser action test corrected the synthetic figure and obtained reviewer approval; engine rejects self-correction and checks originals stay unchanged. | OCR is prepared fixture text. Five-format browser samples are initially qualified drafts. |
| 4. Grievance reconstruction | Chronology, conflicting dates and missing evidence | Browser displayed findings and opened citations. Acceptance 04 checked both dates and missing annexure. | No separate case editing is claimed. |
| 5. Task dependencies | Block premature entry, retain baseline and report scenario | Browser task flow checked proof gates, search and private planning. Acceptance 05, 08 and 14 covered dependencies, applying a scenario and proof. XLSX now includes proposed dates with the baseline. | Custom assignment/deadline editing and scenario application were not exercised in Chromium. |
| 6. Office note | Versioned draft, review and approval before handoff | Browser edited, requested review and approved. Acceptance 06 and 10 verified stale versions and simulated failed handoff. | Reopen-and-return regression results are recorded below. An issued record is outside the demo. |
| 7. Amendment impact | Preserve original and flag downstream records | Browser queued an impact review and observed outreach hold. Acceptance 07 verified original hash and dependent statuses. | Standalone side-by-side amended-document comparison was not verified. |
| 8. Meeting minutes | Resolve ambiguities via chair and create tracked action | Browser confirmed the meeting assignment. Acceptance 11 and 15 reject officer assignment or unconfirmed ambiguity. | Full agenda/calendar collaboration is outside this tested journey. |
| 9. RTI response | Pointwise reply, missing source and disclosure review | Browser returned cited draft. Acceptance 12 verified partial/unavailable answers. | Review return regression results are recorded below. No real disclosure determination is made. |
| 10. Outreach | Three script languages, opt-out, failed contact, approval and pause | Browser approved and simulated; tested opt-out and amendment hold. Acceptance 13 rejects stale and duplicate simulation. Parsed multilingual downloads and inspected screenshot. | Channel-specific voice/WhatsApp and separate escalation/closure interaction remain partial. Contact is entirely simulated. |

## Defects and regression coverage

| Severity | Defect found by code review | Fix and check |
|---|---|---|
| P1 | Reopened review could retain a valid-looking approval and previously prepared handoff | Handoff now requires the approved current version and reviewed state. Reopen, edit and amendment clear stale downstream markers. Engine tests exercise all three invalidations. |
| P1 | Scenario PDF showed changed dates, but XLSX omitted the proposal | XLSX includes baseline and proposed dates with a separate scenario status. Parser regression checks a shifted dependency and unchanged live dates. |
| P2 | The modal captured the initial busy flag, so repeated submit could launch duplicate runs while a request was pending | Synchronous launch guard deduplicates in-flight submits. Chromium test submits twice and checks only one launch request. |

## Matrix

Evidence PASS means exact displayed citations were opened and compared. Export PASS means five draft files downloaded and parsed, with representative content assertions. Inspecting every export after every state transition was not performed.

| Workflow | Frontend | Backend | Evidence | Actions | Export | Approval | Overall |
|---|---|---|---|---|---|---|---|
| 1. Circular comparison | PASS | PASS | PASS | PASS | PASS | N/A: analytical draft | PASS |
| 2. Historical applicability | PASS | PASS | PASS | PARTIAL: default date only in UI | PASS | N/A: analytical draft | PARTIAL |
| 3. Scanned document | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 4. Grievance reconstruction | PASS | PASS | PASS | PASS | PASS | N/A: evidence summary | PASS |
| 5. Task planning | PASS | PASS | PASS | PARTIAL: apply via engine only | PASS | PASS: evidence gate | PARTIAL |
| 6. Office note drafting | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 7. Amendment impact | PASS | PASS | PASS | PARTIAL: standalone comparison unverified | PASS | PASS: downstream hold | PARTIAL |
| 8. Meeting minutes | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 9. RTI response | PASS | PASS | PASS | PASS: draft | PASS | PARTIAL: return retest pending | PARTIAL |
| 10. Citizen outreach | PASS | PASS | PASS | PARTIAL: channel and escalation gaps | PASS | PASS | PARTIAL |

## Verification runs

- First expanded Playwright run: 17 passed.
- Initial engine run: 18 passed, including all 15 mandate acceptance scenarios. See named tests in tests/engine.test.ts for exact fixtures and negative assertions.
- Final regression run: pending.
- Browser checks include sidebar navigation, Chat/Work, citations, hover, Escape to close, task status, approval dialogs, notices/sharing, dark theme persistence, and viewport overflow at 1440, 1280 and 768 pixels. Loading/stepper progression, exhaustive keyboard traversal and all light/dark combinations were not audited.
- Git publication remains blocked by the known HTTP 403. No push attempted.
