# Grievance API

All routes require the existing `brahma-session` cookie. Create a demo session by opening the application. The grievance persona is resolved server-side; request bodies cannot assert a different actor. This is a local demonstration API, not a public integration contract.

## `/api/grievances`

GET without `id` returns scoped, filtered, paginated cases, people, summaries and policy metadata. Search/filter controls supply query parameters. `kind=tasks` returns permitted personal case tasks; `kind=documents&search=...` searches filenames and extracted original text. `kind=csv` exports all matching register rows, not only the current page; `kind=report` exports scoped aggregate counts.

GET with `id` returns the permitted dossier, links, completeness and closure blockers. `kind=links` returns typed relationships. `kind=history`, `pdf` and `ack` download actual stored history or acknowledgement. `kind=attachment|preview|inline&attachment=...` retrieves an authorised original, extracted text or inline PDF. A hidden case cannot be retrieved through these alternate forms.

POST JSON uses `{action,id,revision,...fields}` for existing cases. Actions are defined in `service.ts`, `evidence.ts`, `followups.ts` and `execution.ts`; UI forms are the reference clients. They include intake/registration, assignment, triage, tasks, members, proposals, independent review, requirements, conflicts, follow-ups, packets, manual handoff, source confirmation, appeals, disposal, closure and reopen. `create` does not require an existing ID. `settings` requires admin. `persona` selects a known demo identity in the current session only.

POST multipart uses `id`, `revision`, `file`, and optionally `previousAttachmentId`. Originals are limited to 5 MB and supported TXT/CSV/PDF/DOCX types. A revision retains earlier originals and document identity. Identical original retries do not create duplicate events.

## `/api/legacy`

GET lists only accessible source records and the actor's import jobs. `kind=sample&adapter=...` downloads one of three synthetic exports. `kind=payload&jobId=...` downloads the retained submitted payload when still within scope.

POST `preview` validates `{adapter,input,mapping}`. POST `commit` additionally requires `confirmed:true` and a stable `requestKey`. Valid rows persist; invalid rows are quarantined in the report. `link` explicitly associates a source record; `reconcile` requires an authorised independent decision about a particular snapshot. Neither operation contacts a government system.

## `/api/grievance-chat`

GET accepts `caseId` or `threadId` and returns the authorised persisted thread. POST `{type:'message',text,caseId?,threadId?,newThread?}` performs supported deterministic reads or stages a tool proposal. POST `{type:'confirm',threadId,proposalId,edits?}` confirms an allowlisted proposal against current permissions and revision. Confirmation uses the same transactional domain actions as Work; retries return the existing result. Retrieval includes only real available source excerpts and version/hash references.

## Failures

Responses contain a readable `error`/`message`, a `code` and correlation ID; transition failures can include `blockers`. Expect 401 for a missing session, 403 for denied scope/action, 404 for an unavailable record, 409 for stale revision/conflict, and 503 for an unconfigured outbound connector. A busy store returns a retryable conflict. Do not automatically replay a changed proposal after 409: refresh and review it first.
