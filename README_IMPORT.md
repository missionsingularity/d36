# BrahmaGPT D-36 — Prototype Document Library

**DEMO — SYNTHETIC DATA.** All employees, clients, projects, incidents, decisions, approval states and rules are fictional scenario data, not authenticated company/government records.

## Contents
- 20 editable `.docx` files: charter, status report, decisions, operating procedure for each of five projects.
- Five PDF renditions of the project charters (same source document ID/version).
- `source_manifest.json`: stable document IDs, versions, paths, section anchors, linked tasks and approvals.
- `projects.csv`, `tasks.csv`, `approvals.csv`, `incidents.csv`: consistent structured records for demo imports.

## Source files and citations

The 20 DOCX documents are indexed as searchable workspace records at startup. The migration stores each source ID, version, extracted text, section anchors and SHA-256 file hash. Search results and answer citations open a source preview with a link to the checked original DOCX. The five charter PDFs are linked as alternate file copies.

Regenerate and validate the index after changing source files; the next app restart refreshes the indexed records and file hashes:

```powershell
python scripts/index_source_pack.py
```

The app verifies the file hash again when a user opens a citation link. DOCX citations use the manifest's section anchors. The five PDF files were checked and each contains two pages, but the app does not infer page-level citations from the DOCX; use only a page number verified against the PDF itself.

`projects.csv`, `tasks.csv`, `approvals.csv` and `incidents.csv` remain reference import files. They are not imported as live operational records by the document citation migration.

## Example demo queries
- Which Alpha task is linked to technical approval APR-001?
- Summarise Beta's client website milestones with citations to the project charter.
- What does Gamma's operating procedure say about leave-request visibility?
- What prerequisites block Delta's staging migration?
- Which Epsilon incident is related to escalation rule changes?
- Compare each project's overdue tasks using task due dates and the current system date.

## Accuracy note
The generated reports are dated 2026-11-23. A report is a historical snapshot; the latest operational state should be read from persisted application records. A source citation proves what the source says, not whether that dated statement remains true.
