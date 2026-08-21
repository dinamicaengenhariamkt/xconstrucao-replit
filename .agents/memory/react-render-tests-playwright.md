---
name: React render tests in Playwright
description: How to execute server-rendered React component assertions in this project's Playwright test environment.
---

Run server-rendered React component assertions through a standalone `tsx` script invoked by the Playwright spec, rather than importing `react-dom/server` and application components directly into the Playwright worker.

**Why:** The Playwright TypeScript module adapter serializes some JSX/component values into an incompatible shape for React's server renderer, even though the same render succeeds under `tsx`.

**How to apply:** Keep the integration spec as the entry point and execute a focused TypeScript render script with `npx tsx`; use it for component runtime assertions that cannot be exercised through an existing route.