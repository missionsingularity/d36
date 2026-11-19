# BrahmaGPT workflow verification

Environment: Windows, Next.js, and Playwright Chromium. Browser tests use port 3100 with isolated synthetic data. Baseline app checkpoint: 48df035. Results below distinguish browser journeys, engine acceptance, and remaining scope.

## Common test steps and results

For each catalogue entry, open Customize, launch the fixture, confirm the actual launch request and returned work record, assert the question and structured findings against the visible page, and open every displayed citation. Compare the highlighted passage against the source registry. Switch to Work, refresh, download each format, parse the files, and go back to the same Chat. The first expanded Chromium run passed all ten journeys. The expanded rerun and focused follow-up are recorded below.

Samples: [50 browser downloads and work screenshots](test-results/final/) and [updated amendment downloads](test-results/final-follow-up/). Each case produced a work screenshot and PDF, DOCX, XLSX, PPTX and TXT downloads. Sample artefacts are kept under ignored test results, not in Git. PDF text extraction on all ten browser downloads confirmed the draft status, evidence appendix and not-issued footer. The outreach PDF contains the multilingual fallback. DOCX and TXT preserve Hindi and Assamese script. This is not a visual Office-rendering review.

## Scenario-specific results

| Workflow | Expected | Observed / evidence | Remaining verification or scope |
|---|---|---|---|
| 1. Circular comparison | Multiple dated sources, unresolved conflict, exact excerpts | Browser launched and opened every displayed citation. Acceptance 01 verified both review sequences and the conflict. Report downloaded and parsed. | No unsupported precedence decision is part of the demo. |
| 2. Historical applicability | Apply dated guidance and exclude later rules | Browser launched using the default historical date. Acceptance 02 verified the April source and non-retrospective note; engine rejects impossible dates and cites nothing for pre-source dates. | Chromium submitted a date before the first source and verified an explicit unknown result with zero citations. |
| 3. Scan verification | Preserve ambiguity, require officer correction and independent review | Browser action test corrected the synthetic figure and obtained reviewer approval; engine rejects self-correction and checks originals stay unchanged. | OCR is prepared fixture text. Five-format browser samples are initially qualified drafts. |
| 4. Grievance reconstruction | Chronology, conflicting dates and missing evidence | Browser displayed findings and opened citations. Acceptance 04 checked both dates and missing annexure. | No separate case editing is claimed. |
| 5. Task dependencies | Block premature entry, retain baseline and report scenario | Browser task flow checked proof gates, search and private planning. Acceptance 05, 08 and 14 covered dependencies, applying a scenario and proof. XLSX now includes proposed dates with the baseline. | Chromium rejected officer confirmation, then applied the scenario as reviewer and confirmed the resulting date after reload. The demo uses fixture-assigned owners and priorities. |
| 6. Office note | Versioned draft, review and approval before handoff | Browser edited, requested review and approved. Acceptance 06 and 10 verified stale versions and simulated failed handoff. | Chromium confirmed that reopening review clears stale handoff and blocks a new one. Issuance is outside the demo. |
| 7. Amendment impact | Preserve original and flag downstream records | Browser queued an impact review and observed outreach hold. Acceptance 07 verified original hash and dependent statuses. | The updated result compares the original and amended passages directly, with both citations. Chromium rechecked the comparison and all five downloads. |
| 8. Meeting minutes | Resolve ambiguities via chair and create tracked action | Browser confirmed the meeting assignment. Acceptance 11 and 15 reject officer assignment or unconfirmed ambiguity. | Full agenda/calendar collaboration is outside this tested journey. |
| 9. RTI response | Pointwise reply, missing source and disclosure review | Browser returned cited draft. Acceptance 12 verified partial/unavailable answers. | Chromium confirmed reviewer return with a stated reason and rejected handoff before review and after return. No real disclosure determination is made. |
| 10. Outreach | Three script languages, opt-out, failed contact, approval and pause | Browser approved and simulated; tested opt-out and amendment hold. Acceptance 13 rejects stale and duplicate simulation. Parsed multilingual downloads and inspected screenshot. | Channel-specific voice/WhatsApp and separate escalation/closure interaction remain partial. Contact is entirely simulated. |

## Defects and regression coverage

| Severity | Defect found by code review | Fix and check |
|---|---|---|
| P1 | Reopened review could retain a valid-looking approval and previously prepared handoff | Handoff now requires the approved current version and reviewed state. Reopen, edit and amendment clear stale downstream markers. Engine tests exercise all three invalidations. |
| P1 | Scenario PDF showed changed dates, but XLSX omitted the proposal | XLSX includes baseline and proposed dates with a separate scenario status. Parser regression checks a shifted dependency and unchanged live dates. |
| P2 | The modal captured the initial busy flag, so repeated submit could launch duplicate runs while a request was pending | Synchronous launch guard deduplicates in-flight submits. Chromium test submits twice and checks only one launch request. |

| P1 | Amendment findings did not show the baseline rule alongside the amendment | Added exact original and amended passages and a cited scope/target comparison. Workflow 7 browser and export retest passed. |
| P2 | Share could open an empty-state dialog while a work route loaded | Disable Share on record URLs until workspace data arrives. Focused Chromium sharing/notification retest passed. |

## Matrix

Evidence PASS means exact displayed citations were opened and compared. Export PASS means five draft files downloaded and parsed, with representative content assertions. Inspecting every export after every state transition was not performed.

| Workflow | Frontend | Backend | Evidence | Actions | Export | Approval | Overall |
|---|---|---|---|---|---|---|---|
| 1. Circular comparison | PASS | PASS | PASS | PASS | PASS | N/A: analytical draft | PASS |
| 2. Historical applicability | PASS | PASS | PASS | PASS | PASS | N/A: analytical draft | PASS |
| 3. Scanned document | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 4. Grievance reconstruction | PASS | PASS | PASS | PASS | PASS | N/A: evidence summary | PASS |
| 5. Task planning | PASS | PASS | PASS | PASS: reviewer-applied dates | PASS | PASS: evidence gate | PASS |
| 6. Office note drafting | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 7. Amendment impact | PASS | PASS | PASS | PASS: cited old/new comparison | PASS | PASS: downstream hold | PASS |
| 8. Meeting minutes | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 9. RTI response | PASS | PASS | PASS | PASS: draft | PASS | PASS: return and handoff guard | PASS |
| 10. Citizen outreach | PASS | PASS | PASS | PARTIAL: channel and escalation gaps | PASS | PASS | PARTIAL |

## Verification runs

- First expanded Playwright run: 17 passed.
- Initial engine run: 18 passed, including all 15 mandate acceptance scenarios. See named tests in tests/engine.test.ts for exact fixtures and negative assertions.
- Expanded rerun before the sharing fix: 17 passed and 1 failed (Share during work-record loading). The failed trace is under test-results/final. The focused sharing test passed after the fix.
- Final Chromium follow-up: 3 passed (historical date and scenario persistence, navigation/share, and updated amendment outputs). An earlier scenario follow-up reached persistence but its selector matched both the task and its dependent; the exact task-row assertion passed on rerun.
- TypeScript and isolated production build passed. Final engine run: 20 passed, including the 15 mandate scenarios, handoff invalidation and scenario XLSX regression.
- Browser checks include sidebar navigation, Chat/Work, citations, hover, Escape to close, task status, approval dialogs, notices/sharing, dark theme persistence, and viewport overflow at 1440, 1280 and 768 pixels. Loading/stepper progression, exhaustive keyboard traversal and all light/dark combinations were not audited.
- Git publication remains blocked by the known HTTP 403. No push attempted.
