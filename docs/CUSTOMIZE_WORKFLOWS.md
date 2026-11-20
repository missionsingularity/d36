# Customize and workflow templates

The existing ten operations are preserved, including Outreach as the tenth. Customize has an Examples tab for new source-driven variants and a five-scene pension entry point. These call persistent Next.js services; they are not slideshow responses. Source files and exports remain in the private data directory.

## Templates and runs

`/workflows` lists ten initial published templates. Duplicate creates an owned draft. The editor persists Details, Sources, Steps, People, Rules and Test/Publish stages. Required operation sources must remain accessible. Dependency cycles, missing assignees, duplicate members and inappropriate reviewer/approver roles prevent publication. Publishing creates a hashed immutable definition. Running a published version pins its ID/version and creates actual Work and dependency-linked tasks through the existing operation engine.

The builder configures the supported operations, not arbitrary executable code. Current controls cover source selection, ordered steps, dependencies, assignees, members and independence. More advanced conditional routing, configurable escalation/retry policy and deadline configuration remain future work; existing case/operation safety rules cannot be disabled by the builder.

## Source-driven scenarios

`/api/scenarios` creates the nine non-flagship examples from the shared source pack. Comparison uses current immutable document versions; historical applicability uses the stored issue/effective dates; Plan reads the twelve actual synthetic pension snapshots; Meeting distinguishes confirmed/proposed/unclear passages; RTI leaves the unavailable receipt missing. Outreach retains the existing multilingual script and local simulation.

Evidence references bind source ID, case ID, attachment version and real PDF page (or section-only for a text revision). Source previews and downloads recheck case scope. Derived Work reads, exports and mutations also check the referenced case scopes. Review requires independently verified originals and snapshots their hashes; a superseding source version blocks stale review.

## Shared Ontology and storage

The local SQLite store contains an atomic workspace snapshot plus indexed object/link tables for cases, people, projects, document versions, tasks, approvals, source records, templates, runs, follow-ups, dispatch and audit. The repository boundary retains existing domain methods. It does not call Foundry or claim an OSDK tenant. JSON and a pre-SQLite backup are preserved on migration; SQLite is authoritative afterward.

Original local imports use adapter plus external ID as canonical identity. Snapshots retain source/import timestamps and mapping provenance. The existing three CSV/JSON adapters and reconciliation actions remain separate from government APIs. Flagship adapter controls expose Demo/Disabled states; no genuine external connector is configured. Complete self-service connector registration and HTTP configuration remain pending.

## Commands and safety

`npm.cmd run demo:seed` adds four shared case contexts, twelve pension snapshots, eight movements and sixteen real PDF/DOCX files idempotently. `npm.cmd run demo:reset -- <existing-guided-run-id>` pauses that selected example and creates a new scenario namespace. It never deletes prior cases, unrelated work or files. Missing/unknown run IDs fail instead of deleting data.

Six fictional role IDs are provided in the guided example: DEMO-U-DA, RV, AP, DS, AD and OB. The role selector updates a server session; it is explicitly a demonstration convenience. Production identity, malware scanning, live government connectors, signatures and real delivery are unavailable.
