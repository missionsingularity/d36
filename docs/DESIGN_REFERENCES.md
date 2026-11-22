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
