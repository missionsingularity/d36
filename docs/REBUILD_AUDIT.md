# Rebuild audit — 22 November 2026

The requested workspace was initially empty. Cloned the official repository into the root, with no nested application. Remote: https://github.com/missionsingularity/d36.git; branch: main. Original HEAD: `17a8b1a0edfe38c712f4e0f17738170b85c55b17`. The clone was clean, with no local environment files, uploads or databases.

Recovery: branch `checkpoint/pre-enterprise-rebuild-20261122` and ignored `recovery-before-rebuild.bundle`. `git bundle verify` confirmed complete history. Recover with `git clone recovery-before-rebuild.bundle <empty-recovery-folder>`.

## Manifest

- KEEP: Git history, documentation, original fixtures and regression tests, export libraries, Node SQLite support, theme preferences. Existing `.data` is never removed.
- ARCHIVE: original government-specific UI and API implementation in the recovery checkpoint; remove from the active application after the enterprise replacement passes validation.
- REPLACE: root shell, global styles, navigation, home, chat, enterprise data service and setup instructions.
- REMOVE: obsolete government route/components after verification; preserve original code in Git instead of a second running application.

Inventory: Next App Router with root and catch-all page; government demo, grievance, inbox, workflow, systems and notebook APIs; synthetic catalog and local SQLite snapshot; DOCX/PDF/Excel/PowerPoint generators; unit and browser tests; lotus SVG. No AGENTS.md found. No uncommitted user changes to preserve.
