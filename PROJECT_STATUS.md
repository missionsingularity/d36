# BrahmaGPT project status

Updated 19 November 2026. Base checkpoint `d098a46` on `main`. The commit containing this report is the subsequent local checkpoint (`git log -1 --oneline`). Official remote is `https://github.com/missionsingularity/d36.git`. Publication remains blocked by the previously confirmed GitHub HTTP 403 for `slevel7`. This verification run made no push attempts.

## Demonstration

Run `npm.cmd run dev` from the project directory. The standard local URL is `http://127.0.0.1:3000`. The pre-existing process on 3000 timed out during this run. The final production preview returned HTTP 200 on `http://127.0.0.1:3002`. Chromium verification ran against a fresh isolated Next.js instance on port 3100.

New Chat, Projects, Customize, Documents, My Tasks, Profile, and the shared Chat and Work record are implemented. Grievance is the shared synthetic case context. Outreach opens from Customize or Projects. The ten workflow journeys use the existing deterministic engine and local store. Review, evidence, task dependencies, document version history, scenarios, and outreach amendment checks are exercised with synthetic records. Sharing displays a copyable local record URL even when clipboard access is denied. Notifications link to the corresponding record and decision or activity view.

## Verification

- `npm.cmd test`: 18 passed, including all 15 business-state acceptance cases and document generation/parsing checks.
- `npm.cmd run typecheck`: passed using the standalone TypeScript configuration.
- `npm.cmd run build`: passed using an isolated Next.js output directory.
- Initial Playwright suite: 6 passed. All ten workflows launched through the UI, retained the record across Chat and Work, opened citations, and generated downloadable PDFs. Review, versioning, task proof, scan correction, chair confirmation, outreach, amendment holds, and viewport overflow were covered. The HTTP test checked role restrictions, source revocation, cross-origin rejection, original upload preservation, and Office/TXT download responses.
- Engine tests parsed the generated PDF, DOCX, XLSX, and PPTX structures and checked TXT content. This was structural validation, not visual inspection of every exported file.

- Follow-up Chromium runs passed the ten predefined-question checks and the New Chat, hover preview, local sharing, and notifications journey. The first navigation attempt needed a longer wait for the initial route compilation.

## Remaining limitations

Demo personas and approvals are simulated. Sharing is local and sends no email. Outreach is simulated and makes no external contact. PDF/DOCX uploads preserve original bytes without binary extraction. PDF uses Latin fonts, with DOCX/TXT for complete multilingual passages. Production authentication, live integrations, and multi-process persistence are outside the demo scope. Responsive checks cover overflow at 1440, 1280, and 768 pixels. A formal accessibility audit has not been performed.
