# BrahmaGPT

A desktop-first, monochrome government-work demonstrator. All seeded records are synthetic, not government rules. Built as a single Next.js application; no paid AI API, Docker, or separate backend required.

## Local development

Node.js 22 or later. In PowerShell use `npm.cmd` when script execution policy prevents `npm`.

```sh
npm install
npm run dev
```

Open http://127.0.0.1:3000. Choose **Customize** to launch any of the ten workflows. Use **Open in Work** to inspect evidence, manage decisions and download outputs. Run `npm run typecheck`, `npm test`, `npm run build`, and `npm run test:e2e` for verification. Playwright uses an isolated demo store and requires Chromium (`npx playwright install chromium`). See [PROJECT_STATUS.md](PROJECT_STATUS.md) for test results and demo limits.

## Typed chat and project members

The New Chat composer executes local record queries on the server and retains conversation history. Supported examples include find documents about pension, show overdue tasks, and show pending approvals. The deterministic path is explicitly labelled. A remote model adapter is still pending.

Projects supports a local member picker and avatar stacks, duplicate prevention and last-owner protection. Project labels do not yet implement department-scoped membership authorization. The three demo personas resolve from opaque server-side sessions. Open Profile to switch personas.

Use .env.example for optional local settings. Runtime records remain in the ignored .data directory. Keep a single app process for local JSON persistence.
