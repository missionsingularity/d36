# Workspace refinement checklist

## Implemented in this pass

- Replaced the redundant New chat sidebar entry with Home.
- Added People navigation with searchable fictional employee profiles, team pages, expandable manager reporting lines, relationship search, an access summary and approval links.
- Added a versioned SQLite seed migration for 31 fictional Singularity employees across eight teams. Emails use `singularity.example`; phone numbers use the fictional 555-0100 range.
- Connected employee, manager, team, project, task and document records through the existing SQLite relationship table.
- Added an Alpha project workspace with overview, task board/list, documents, people, approvals, activity and relationship tabs.
- Added eight ALP task records and twelve stored project document records with source text, filenames, versions and links.
- Expanded task status values and added server-side checks for task ownership, dependencies and completed/cancelled status.
- Added Search chats and moved Settings into the profile menu.
- Preserved existing records and made the seed migration idempotent. Removed only three duplicate fictional staff rows created during an earlier seed iteration.

## Still incomplete

- Access is an informative view of current workspace roles and team/project membership. Direct resource grants, inherited permission explanations and revoke actions are not implemented.
- The organisation view is an expandable reporting tree; zoom and pan are not implemented.
- Task comments, file attachments, reassignment, board drag-and-drop and transition-specific workflow rules are not implemented.
- Alpha sample documents are stored and searchable as workspace records. They are not yet separate downloadable versioned files.
- The project approvals tab shows approvals linked through existing document targets. The brief's named APR sample set and linked release prerequisites are not seeded.
- Notifications retain their existing saved list and read action; a contextual popover and record-specific destinations are incomplete.
- The separate synthetic government-record collection and configurable external integrations are not implemented.
- No external system connection is claimed by this workspace.

## Validation

- `npm run typecheck` passed.
- `npm run build` passed.
- `npm test` passed: 34 tests. The Windows runner needed a temporary `os.userInfo` compatibility preload because the host returned `uv_os_get_passwd ENOMEM`; the preload was removed after the run.
- Local workspace API returned 31 employees, eight teams with the requested counts, eleven Alpha task records (including three preserved existing tasks), thirteen Alpha document records, and persisted relationship rows.
- Local routes `/`, `/people`, `/projects` and `/projects/alpha` returned HTTP 200.
