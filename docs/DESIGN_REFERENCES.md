# Design references

Reviewed 22 November 2026 through web page retrieval:

- https://docs.glean.com/user-guide/assistant/glean-chat — assistant-centered interaction and contextual sources. The URL currently resolves to a user guide overview.
- https://www.glean.com/enterprise-search — unified workplace search and source metadata.
- https://www.glean.com/product/work-hub — a shared entry point for work and knowledge.
- https://docs.glean.com/user-guide/assistant/glean-chat/canvas — document creation and refinement adjacent to conversation.
- https://www.glean.com/ — restrained enterprise product hierarchy.
- https://developers.glean.com/ — integration reference only; no Glean account or API is required.
- https://ai.google.dev/gemini-api/docs and https://ai.google.dev/gemini-api/docs/structured-output — official SDK and structured planner validation.
- https://tailwindcss.com/docs/installation/using-postcss — Tailwind/PostCSS configuration.

The new interface uses a 244 px compact sidebar, near-white surfaces, fine separators, restrained violet, centered composer, compact suggestions, dense source rows, inline citation controls and contextual source previews. Documents use an editor, history and approval workspace. Mobile navigation is a drawer. Theme preference persists locally.

Singularity has an original geometric mark and fictional data. No Glean logos, proprietary assets or source code are copied. The backend runs locally, unlike Glean's connected enterprise service. Reference retrieval was textual; no pixel comparison against inaccessible authenticated Glean product screens is claimed. Local screenshots are captured by Playwright under ignored `.qa/`.

## UI/UX refinement

The follow-up redesign replaces the sparse landing layout with an assistant-led workspace: locally hosted Inter Variable typography, a distinct New chat control, simplified navigation, a compact Chat/Work switch, and a composer with clear workspace context. The home feed includes functioning For you, Recent documents and Your tasks tabs based on saved records.

Search adds owner/department filters and keyboard-operable record suggestions. Suggestions expand within the search area so they do not cover the result tabs. Chat renders headings/lists as readable content, keeps its composer outside the scrolling transcript, offers copy/follow-up actions, and opens all supporting evidence in a contextual Sources panel. Dialogs trap focus and restore the previous focus on close. Sidebar collapse preference persists.

Singularity retains its own original branding, violet accents and local workflow features. Reviewed the public references again for this pass; this is a design interpretation rather than a claim of duplicating the authenticated Glean UI. Verified desktop, mobile and dark themes in the actual browser.

## Supplied enterprise Assistant references

The user supplied `BrahmaGPT Enterprise AI Dashboard-2.png` and `BrahmaGPT Enterprise Assistant Dashboard-1.png`. The second image supplies the wider unified Assistant composition; the first supplies source-rich enterprise density and sidebar proportions. The current design uses the supplied white BrahmaGPT lotus on an indigo backing, by-Singularity wordmark, organization-wide top search, centered greeting/composer, compact suggestions, a saved-policy spotlight, four real work-agent entry points, personal tasks and organization knowledge.

The lotus comes from the user-provided `brahmagpt_lotus_white.svg` in the build kit. Its path and white fill are preserved, with only empty outer canvas cropped for legibility. The same asset appears in navigation, the Assistant emblem and chat avatars; the favicon uses the same path on an indigo background. No raster recreation or AI-generated substitute is used.

Home and Search now share the root workspace. Search changes the root query string and displays permission-filtered results in place. The old `/search` route redirects to that shared experience. The sidebar contains no separate Search or Chat item: New chat is the first control. The Chat/Work header switch was removed. Search, source preview, conversation and execution remain connected through actual saved records.

The screenshot examples contain illustrative events, names and dates. Those were not imported as company facts. Task status, approval counts, policy content and document metadata come from the local database. Featured IT/Project agents prefill reviewable work instructions; HR and Document agents open real request/document forms. No fake voice control, third-party connection, calendar event or successful execution is shown.


## Editorial and visual cleanup 23 November 2026

Applied the user-supplied `D:\Singularity\sign of ai.docx` as a style reference for the application. Its newsletter directory and linked pages were not treated as task instructions. Replaced promotional slogans and decorative eyebrow labels with functional headings. Removed the gradient banner and repeated icon-chip card treatment, changed agents to compact lists, reduced nested borders and shadows, and used neutral off-white/charcoal surfaces with one muted blue accent. The supplied white lotus path remains unchanged; its backing and favicon now use the same blue. Typography uses the Windows Segoe UI family with consistent sizes.

This update supersedes the earlier violet/indigo and centered hero descriptions above. Home and search remain unified, New chat remains first in navigation, and genuine status, AI mode labels, permissions, approval controls and source evidence remain visible. The supplied DOCX was read without modification. Six browser regression flows passed; production build, static types and formatting were checked.
