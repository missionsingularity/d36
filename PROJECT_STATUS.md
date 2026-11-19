# BrahmaGPT project status

Updated: 19 November 2026. The user reconfirmed missionsingularity/d36 as the official repository, superseding the proposed migration to slevel7/BrahmaGPT-D-36. Local development may continue; publication is blocked by GitHub write permissions.

## Repository and migration blocker

- Current checkout: `C:/Users/spond/Singularity/d36`, branch `main`.
- Current origin remains `https://github.com/missionsingularity/d36.git`. It was empty when cloned.
- Official repository: `https://github.com/missionsingularity/d36.git`. No remote change or migration is required.
- Previously considered repository (now superseded): `https://github.com/slevel7/BrahmaGPT-D-36.git`.
- Intended main fetched read-only: `d13637b18c47b3e477800d169c7101299199774f` (`docs: record verified delivery and remaining integration work`). Its history includes an existing Next.js/FastAPI application and begins at `58be701`.
- Local history begins at `4f83442`; latest implementation checkpoint before this handoff is `79b71d8`. There is no common ancestor with intended main.
- Git Credential Manager is configured. The latest `git push --dry-run origin main` failed with HTTP 403: `Permission to missionsingularity/d36.git denied to slevel7.` No write access is available for the current authenticated account. `git ls-remote origin` returned no branch references.
- Latest successful GitHub checkpoint from this session: **none**. Do not describe local commits as pushed.
- No remote was changed, no history was overwritten, and no force push occurred. Local implementation is preserved through `93cc7a2`, followed by the status-only checkpoint containing this update. The working tree was clean before this update.

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

## Next steps

1. Continue the single-Next.js implementation in the current checkout and preserve working progress with local commits every 5–7 minutes.
2. The owner must grant `slevel7` write access to missionsingularity/d36 or authenticate Git Credential Manager with an account that has write access.
3. Before publishing, recheck remote references. Push normally only if empty or a fast-forward is possible; stop if unrelated history appears.
4. Push existing local commits once access is available, then continue regular tested checkpoints. Never force-push.
5. Complete desktop navigation and the ten executable workflows, then run build, automated tests and actual browser verification.

The unrelated slevel7 repository was inspected read-only. Do not merge or migrate it unless the user requests that again.

The confidential local `private/` directory is ignored and must never be staged, pushed or copied into public documentation.
