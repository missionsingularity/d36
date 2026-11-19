# BrahmaGPT

A desktop-first, monochrome government-work demonstrator. All seeded records are synthetic, not government rules. Built as a single Next.js application; no paid AI API, Docker, or separate backend required.

## Local development

Node.js 22 or later. In PowerShell use `npm.cmd` when script execution policy prevents `npm`.

```sh
npm install
npm run dev
```

Open http://127.0.0.1:3000. Choose **Customize** to launch any of the ten workflows. Use **Open in Work** to inspect evidence, manage decisions and download outputs. Run `npm run typecheck`, `npm test`, `npm run build`, and `npm run test:e2e` for verification. Playwright uses an isolated demo store and requires Chromium (`npx playwright install chromium`). See [PROJECT_STATUS.md](PROJECT_STATUS.md) for test results and demo limits.
