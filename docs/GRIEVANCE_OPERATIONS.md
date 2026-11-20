# Grievance Operations — local demonstration

Open `/projects`, then **Grievance Operations → Open**. The case workspace is at `/projects/grievance`. The original ten guided demonstrations remain under Customize. Cases are independent persisted records; a guided workflow is not silently counted as a grievance.

## Demonstration identities

Select **Local demo role** in the case workspace. This updates the server-issued session's grievance persona. It is deliberately available for demonstrations and is not production authentication. Existing Officer, Reviewer and Guest sessions default to Officer, Approver and Viewer here. The original workflow roles remain unchanged.

| Action | Intake | Officer | Supervisor | Approver | Admin | Viewer |
|---|---|---|---|---|---|---|
| Create/register | Own | Yes | Yes | No | Yes | No |
| Edit intake | Own draft | Creator/assigned | Yes | No | Yes | No |
| Assign/transfer | No | No | Yes | No | Yes | No |
| Work, proposals, requests, tasks | No | Assigned | Yes | No | No | No |
| Add evidence | Own | Assigned | Yes | No | No | No |
| Independently verify evidence | No | No | Yes | Yes | No | No |
| Return proposal | No | No | Independent | Independent | No | No |
| Approve exact proposal | No | No | No | Independent | No | No |
| Close approved case | No | No | Yes | Yes | No | No |
| Reopen / record configured internal appeal | No | No | Yes | No | Yes | No |
| Categories, scopes, policies, import | No | No | No | No | Yes | No |
| Read | Scoped | Scoped | Scoped | Scoped | Scoped | Scoped and explicitly on team |

Every operation also checks project membership, department, district, sensitivity, current stage and expected revision. Admin does not override proposal authorship, evidence verification or version integrity. A person's project membership and department jurisdiction are separate fields. Demo Other Department exercises denial. A viewer must be explicitly included on a case team; no sample viewer access is implied.

## Processing a case

1. Intake saves a draft, edits it and registers it. The draft already has a stable internal number; registration preserves it and records a new event. Required registration fields and duplicate references are validated server-side.
2. Supervisor assigns an eligible officer. The officer starts work and may request missing evidence with an owner.
3. Attach a synthetic TXT, CSV, PDF or DOCX original (maximum 5 MB). Download or preview it. A different supervisor/approver verifies it. A requested document must be acknowledged before review.
4. Officer saves proposal v1 and requests review. Every attachment must be verified. Approver checks the originals and either approves the exact version or returns it with a reason.
5. Editing a reviewed/approved proposal or changing its evidence invalidates the earlier decision. Stale revisions are rejected with HTTP 409. Self-review and wrong-role actions return 403.
6. Approval alone cannot close a case. Prepare the current ATR/reply packet, obtain independent packet review, record execution and verified submission proof, then obtain independent source confirmation. Complete tasks, requests and follow-ups and resolve evidence/source conflicts. Record disposal, then authorised internal closure with reasons. Nothing is transmitted by this application.
7. Closed cases are read-only. Supervisor/admin may reopen with a reason; original closure, decisions, files and events remain available. An internal appeal additionally needs a configured policy and attached internal source. No appeal is filed externally.

Each case event records actor, timestamp, before/after stage, revision and a hash linked to the preceding event. These hashes detect accidental changes; they do not make local disk storage tamper-proof.

## Work, chat and exports

Case chat processes supported typed queries and stages intake, task, follow-up, draft, assignment and source-link changes for confirmation. These deterministic tools use the same transactional services and permissions as Work. Conversations, tool results and source excerpts persist. General AI and remote provider integration are not configured. Original source files are accessed through the scoped grievance endpoint. Work exports include the case reference and evidence hashes. Approval and closure stay in the dossier. See GRIEVANCE_DEMO.md for the current review script.

Existing guided Work can be explicitly linked without altering its source material or its approval process. The two-way case link is visible only to a persona who can read that case. Original Work approval is separate from case proposal approval. Generic chat excludes case Work; scoped case questions belong in Case chat.

Register CSV exports apply the current search/filter/sort criteria to every matching row, rather than just the visible page. Report CSV uses permitted stored cases. Case history TXT and PDF and acknowledgement PDF contain actual stored data. CSV formula prefixes are escaped. The PDF uses a Latin font; full Unicode case history is available in TXT. No document is signed, issued or dispatched.

## Policies and official references

The 21-calendar-day seed policy is a configurable demonstration target. It does **not** establish that central CPGRAMS deadlines govern Assam cases. Admin may add policies with reference, explanation, effective date, calendar/weekdays calculation and an optional internal appeal window. Existing receipt dates and due-date basis are retained. Business-day calculation excludes weekends; no holiday calendar is installed.

The [Assam department service description](https://ppg.assam.gov.in/information-services/details-of-services-provided) describes grievance redressal and transfer to concerned departments. Central terminology is grounded in [CPGRAMS](https://pgportal.gov.in/) and its [FAQ](https://pgportal.gov.in/Home/Faq). The FAQ describes the central 21-day redressal target and a 30-day appeal filing window. The [DARPG guidelines reference](https://www.darpg.gov.in/static/uploads/2025/11/cc18aa7740f075a249f38bd250b8651c.pdf) was found in official search, although the full large PDF could not be fetched by the browsing tool. The supplied Assam lodge-your-grievance URL returned 404 during verification. Accessibility references: [UX4G](https://www.ux4g.gov.in/) and [GIGW](https://guidelines.india.gov.in/). No compliance certification is claimed.

## Local legacy import

Admin opens Settings and pastes a fixed-format CSV:

```csv
reference,title,narrative,received,category,office,department,district,priority
SYNTHETIC-001,Sample pension delay,Synthetic description,2026-11-01,Pension delay,Demo desk,Pension,Demo North,Medium
```

Preview shows column values and row validation/duplicates. Confirm imports the entire validated batch atomically, including its original batch ID. Reversal is blocked if any imported case has later actions. An unchanged batch can be reversed into retained **Voided** records, preserving originals and history. Where later actions exist, admin can void an individual imported case with a reason. No deletion or live legacy-system connection is offered.

## Storage and security limits

Backward-compatible optional grievance fields live in the existing `.data/state.json`. Originals live in `.data/grievance-evidence`, addressed by validated SHA-256 hashes. Both paths are ignored by Git. Transactions acquire an exclusive local lock before read/modify/write and atomic rename; overlapping writers return a retryable conflict. A pre-ontology state backup is retained locally. Crash recovery across multiple files, automatic stale-lock recovery, distributed coordination, production authentication, encryption at rest and malware scanning remain outside this local demo. Do not enter confidential documents, real identifiers or personal government data. Three richer local source adapters now supplement the older CSV intake path; see LEGACY_IMPORT_GUIDE.md.
