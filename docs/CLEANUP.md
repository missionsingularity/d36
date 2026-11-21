# Cleanup — 22 November 2026

Removed generated test artifacts: `.next-test`, `.test-data`, `.qa`, `playwright-report`, and `test-results`. They contain only agent-generated builds, fictional test records, screenshots and reports; future test runs can regenerate them.

Removed the retired government's 22 browser specifications, old Playwright configuration, two obsolete seed scripts, their three package commands, and the unused `public/lotus.svg`. These described the replaced application, not current acceptance coverage. Current enterprise/browser tests and all 60 historical service regressions remain. Removed tracked files are recoverable from Git commit `9e89421`.

Preserved eight historical status reports under `docs/archive/` instead of deleting documentation. Preserved `.env.local`, `.data`, `.git`, the recovery bundle, installed dependencies, production build, active source and current documentation. No user uploads or private records were deleted.

Validation: TypeScript, formatting lint and all 16 enterprise/Gemini adapter tests passed. No runtime behavior or dependencies changed.
