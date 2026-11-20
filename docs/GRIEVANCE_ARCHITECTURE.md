# Grievance architecture

20 November 2026. Internal demonstration using synthetic records only.

The existing Next.js application, deterministic ten-workflow engine and export libraries remain in place. `lib/grievances` adds domain services; the dossier, typed case chat and linked Work all call those services. No government portal or AI provider is connected.

## Records and relationships

Cases have a stable internal ID, source reference, original receipt date, deadline basis, department/district scope, lead, collaborators and revision. Typed links connect issues, immutable document versions, tasks, follow-ups, drafts, exact-version approval requests, source snapshots, outbox actions, appeals and conversations. Duplicate candidates require an explicit human link decision; records are not merged automatically.

Source status is stored separately from internal workflow status. Imported historical disposal is labelled as source information and requires independently verified proof before internal archival closure. Source timestamps, submitted import payloads and superseded snapshots are retained. Older snapshots cannot replace newer ones automatically.

## State and authority

Intake saves a draft, then registers the same internal ID. Assignment, triage, evidence requests, review, return and revision are explicit actions. Specialist referrals require a recorded acknowledgement; the original receipt clock stays intact. Evidence requirements and conflicting originals block review until addressed.

Approval binds the proposal version, text hash, evidence hash and assigned authority. Changes invalidate prior approval. Approved text is not automatically signed, sent or closed. Independently reviewed ATR/reply packets, verified submission proof, independent source confirmation, completed dependencies and resolved conflicts precede disposal and closure. An unavailable connector returns an error without a false acknowledgement.

Appeals are independent records with their own reviewer, decision, communication proof and finalization. Original decision-makers cannot review their own appeals. Reopening preserves prior closure and audit history.

## Persistence and security boundary

The temporary store is the existing `.data/state.json`, written through an exclusive local file lock and atomic rename. A pre-ontology backup is created before upgrading existing cases. Originals are content-addressed by SHA-256 in `.data/grievance-evidence`; revisions retain prior bytes. These paths are excluded from Git. See `docs/decisions.md` for migration and recovery decisions.

Opaque HttpOnly sessions select server-resolved demonstration identities. Services re-evaluate current membership, department, district, restricted-case membership and action permissions. Reads, search, originals, exports and typed tools use the same scope. Mutations check revision and origin; transaction failures do not commit partial state. The persona selector is intentionally a demo control, not production authentication.

The local lock is not a distributed database or tamper-proof audit system. Stale locks after crashes require operator inspection. No production identity, encryption-at-rest guarantee, malware scanning, holiday calendar or multi-host operation is claimed. Scans require OCR outside this demo; no text is invented. PDF exports use Latin fonts; Unicode TXT/DOCX remain available where supported.

## User interface

`/projects/grievance` contains overview, register, intake, source imports and administration. A case has Overview, Evidence, Timeline, Notes, Tasks, Decision, Appeals, History and Case chat. The centred Chat/Work switch preserves case context. Case tasks also appear in My Tasks; permitted originals appear in Documents with extracted-text search. Shared appearance persists across routes. Local manual handoff and unconnected integrations are explicitly labelled.
