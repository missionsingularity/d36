# Functionality audit

| Capability | Current behavior |
|---|---|
| Guided workflow catalogue | Working deterministic synthetic demonstrations, separately labelled from general model conversation |
| General AI conversation | Provider configuration required; no live provider configured |
| PDF and DOCX upload | Original bytes preserved. Text extraction added; image-only scans require OCR/manual transcription |
| Document search | Searches authorised source and uploaded text with actual excerpts |
| Source citations | Exact fixture section references and uploaded PDF page markers |
| Drafts and versions | Working office-note editing, attributed versions and export |
| Human approvals | Working simulated personas and version-bound reviews |
| Exports | PDF, DOCX, XLSX, PPTX, TXT generation |
| Research notebooks | Missing |
| Department selection | Missing; shared illustrative workspace exists |
| Workspace and audit | Persisted local records, role restrictions and audit events |
| Remote publication | Blocked by previously confirmed HTTP 403 |

## Latest master prompt coverage

- Working and browser-verified: typed deterministic source/task/review queries, saved threads and follow-ups, exact citations, conversation-to-office-note association, Chat/Work return, server-resolved demo sessions, project member picker/avatars/removal and last-owner guard.
- Existing workflows retained: original ten scenario engine, version-bound review, evidence gates, immutable uploads, PDF/DOCX/XLSX/PPTX/TXT outputs and saved preferences.
- Partial: shared project member access labels, with role-based mutation checks but pending department/project-membership isolation. Three demo roles are supported.
- Pending: SQLite migration, remote provider adapter, five-role approval route, grievance create/edit/inbox/lifecycle, custom task CRUD and multi-assignee model, legacy reversible import, notebooks, full project archive/restore and department isolation.
- The d36_codex_pack directory was unavailable. The supplied master prompt and two image files plus the earlier Tasks image were read locally. They were not copied into public source.

## Current grievance upgrade
Working: case register, intake, originals, exact-version proposals, internal closure/reopen, role/scope checks, reports and fixed CSV import. New service-tested: typed links, multiple case members, duplicate suggestions/decisions and writer exclusion. Partial: case chat templates and local appeal marker. Missing: separate execution/communication/appeal lifecycle, richer external snapshots/adapters, follow-up/escalation and full typed case agent. GitHub access is restored; official pushes currently succeed.


## Current ontology audit — 20 November 2026
Persistent intake, scoped department/district/case permissions, typed links, teams, immutable originals/revisions, evidence requirements/conflicts, follow-ups/reminders, three local adapters, reconciliation, exact review, proof-gated ATR/manual handoff, independent appeals and closure/reopen are implemented. Typed offline Chat shares Work services; case documents/tasks/search/notifications are connected. Typecheck and 47 service tests pass. Production build passed; browser regression found transition failures under correction. See GRIEVANCE_TEST_REPORT.md for 28-case evidence and partial items. Official GitHub checkpoint pushes work; older HTTP 403 entries are historical. No government/AI integration is connected.
