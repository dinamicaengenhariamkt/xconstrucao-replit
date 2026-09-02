---
name: Replit Playwright Chromium
description: How browser E2E tests launch reliably in the current Replit workspace runtime.
---

Use the executable exposed by `REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE` for Playwright launches in this workspace.

**Why:** The Replit-provided browser is built for the workspace loader and launches successfully without `playwright install`; Playwright's separately downloaded browser previously conflicted with the runtime's glibc loader.

**How to apply:** Keep the executable path in shared Playwright launch options so browser fixtures also work in mixed API/UI specs. Preserve the system Chromium dependency for reproducible workflows.