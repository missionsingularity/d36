# Implementation decisions

The latest user instruction overrides the build kit's infrastructure requirements. This demonstrator uses one Next.js application, server route handlers, and local persistent files. No Python service, PostgreSQL, Docker, enterprise authentication, or deployment service is required.

The GitHub repository was empty at inspection. Existing history has not been rewritten. Confidential references are read from their original local paths and are never copied into this repository. Only synthetic fixtures and the explicitly supplied public product logo are included.

Primary navigation follows the written brief: Projects, Customize, Documents. Grievance and Outreach remain contextual experiences. Every external interaction is simulated or manual and never represents actual dispatch.

## Current design brief

The latest supplied master prompt requests warm near-white light surfaces, graphite dark surfaces and restrained evergreen action emphasis. The supplied lotus is retained. New Chat is placed above Projects. Wide desktop tool discovery uses a compact three-column grid and the Chat/Work switch is centred with a three-column top bar. Theme foreground/background changes apply together to avoid contrast loss during colour interpolation. Light and dark Customize screenshots were captured from the live app and inspected.

## Ontology persistence checkpoint
Retain the tested JSON repository temporarily rather than risk replacing existing records during the feature upgrade. Transactions now hold an exclusive filesystem lock before read/modify/write; overlapping writers receive 409, not a lost update. Atomic rename retains complete snapshots. A pre-ontology backup is copied once under ignored .data/backups before adding optional ontology fields. This is a local single-host demonstration, not distributed storage. If the process crashes while holding state.lock, stop all app writers, inspect the recorded PID, retain a copy, then remove only the abandoned lock before restart. Never remove a live writer's lock. Rollback: stop the app, preserve current state, restore the backup with compatible source; never delete uploads. SQLite migration remains a separately tested future change.


## Customize v2 local SQLite migration
The active store is now .data/brahmagpt.sqlite using Node 22 built-in node:sqlite (experimental warning is expected). The first successful transaction imports the existing workspace without deleting state.json and preserves backups/pre-sqlite-v1.json. Snapshot and typed ontology_objects/ontology_links indexes commit together under BEGIN IMMEDIATE; failed domain actions do not commit. The local writer guard remains. Object payloads retain backward-compatible domain structures rather than a wholesale schema rewrite. This is a local adapter, not a distributed database or enterprise security boundary. Stop all app processes before any manual recovery; back up the complete data directory including SQLite/WAL/SHM and originals. Never restore stale JSON over an active database. Migration/rollback tests and a production build passed.
