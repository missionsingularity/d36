# Desktop implementation snapshot

Entrypoint: `app/page.tsx`. Existing API: `app/api/demo/route.ts`. Reuse `launch`, `act`, `exportRun` and atomic JSON persistence without replacement.

Current blockers: minimal frontend; no browser tests; exports not runtime verified; GitHub write access denied.

First slice: shared monochrome shell, New Chat, workflow catalog, persistent Chat/Work context, source viewer and Profile. Then connect all action gates and verify real exports.
