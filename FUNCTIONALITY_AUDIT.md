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
