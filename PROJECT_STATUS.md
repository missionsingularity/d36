# BrahmaGPT project status

Updated: 19 November 2026. Development paused at the user's explicit instruction because local and intended remote histories are unrelated.

## Repository and migration blocker

- Current checkout: `C:/Users/spond/Singularity/d36`, branch `main`.
- Current origin remains `https://github.com/missionsingularity/d36.git`. It was empty when cloned.
- Intended repository: `https://github.com/slevel7/BrahmaGPT-D-36.git`.
- Intended main fetched read-only: `d13637b18c47b3e477800d169c7101299199774f` (`docs: record verified delivery and remaining integration work`). Its history includes an existing Next.js/FastAPI application and begins at `58be701`.
- Local history begins at `4f83442`; latest implementation checkpoint before this handoff is `79b71d8`. There is no common ancestor with intended main.
- Git Credential Manager is configured. GitHub rejected both attempted pushes to the original origin with HTTP 403, identifying the authenticated account as `slevel7`. Write access to the intended repository has not been tested by a push.
- Latest successful GitHub checkpoint from this session: **none**. Do not describe local commits as pushed.
- No remote was changed, no history was overwritten, and no force push occurred.

## Completed locally

- Read the full master build directive, 28-page confidential mandate, reference instructions and copy/design notes locally.
- Single Next.js/TypeScript foundation and supplied lotus logo; minimal landing page only.
- Ten-workflow catalog with fifteen synthetic source records and exact section references.
- Deterministic source-backed analysis for all ten demonstrations.
- Local atomic JSON storage; persisted work records, immutable draft versions, hashes and audit events.
- Engine guards for exact-version review, role restrictions, dependency proof, scan correction, chair confirmation, what-if scenarios and simulated outreach.
- Next.js route handler for demo state, execution, actions, original uploads, source downloads, exports, preferences, projects, demo sharing and access revocation.
- PDF/DOCX/XLSX/PPTX/TXT export implementation and idempotent synthetic source generation script.
- Confidential references and local data are ignored. Only synthetic fixture content and the supplied logo are intended for publication.

## Tests and known issues

- `npm.cmd run typecheck` passes for the current source after two narrowing errors were fixed.
- Dependencies installed. npm reported seven dependency vulnerabilities (three moderate, four high); investigation/remediation pending.
- No application build, unit tests, API integration tests, generated-artifact verification or browser verification has been completed.
- Export and workflow behavior is implemented but not yet verified at runtime.
- Desktop shell, connected navigation, chat/work views, document viewer, tasks, settings UI and presentation polish are pending.
- Current storage supports one Node process only. Demo role switching is deliberately not production authentication.
- Uploaded PDF/DOCX originals are preserved, but binary extraction is not implemented.
- PDF generation uses standard Latin fonts; multilingual passages refer to complete Unicode TXT/DOCX outputs. Full multilingual PDF rendering is pending.
- No live external integrations, external AI calls, actual government dispatch or citizen contact exist.

## Safest next steps

1. Preserve this local branch and all uncommitted/untracked work in a local checkpoint (done with the commit containing this file).
2. After user approval of migration, create a separate checkout/branch rooted at intended remote main `d13637b`.
3. Read that repository's contributing instructions, application and tests before choosing integration points.
4. Selectively port the synthetic catalog and useful engine/UI work. Avoid blind replacement of its existing application or an unrelated-history merge.
5. Implement the requested single-Next.js presentation app without deleting historical implementation records; document any replacement decisions.
6. Test, commit and push the new descendant feature branch normally, then continue 5–7 minute working checkpoints.

The confidential local `private/` directory is ignored and must never be staged, pushed or copied into public documentation.
