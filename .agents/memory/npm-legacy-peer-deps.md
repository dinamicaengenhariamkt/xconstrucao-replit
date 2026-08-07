---
name: npm peer-dep conflicts in deployment
description: Deployment runs a clean npm install that fails without legacy-peer-deps mode; project .npmrc must set it.
---

# npm peer-dep conflicts in deployment

## The rule
`.npmrc` must contain `legacy-peer-deps=true`. Without it, the deployment's clean `npm install` fails with ERESOLVE.

**Why:** `react-data-table-component@7.7.0` declares `styled-components >= 5.0.0` as a peer dependency. npm@10+ resolves that to `styled-components@6`, which carries `react-native` as an optional peer, which in turn requires `react@^19`. The project uses `react@18`, causing an irreconcilable peer conflict in strict mode.

**How to apply:** Any time a new package is installed — especially with `--legacy-peer-deps` — verify that `.npmrc` still contains `legacy-peer-deps=true`. If it gets removed or a lockfile is regenerated without the flag, the next deployment will fail at the `npm install` step with ERESOLVE before the TypeScript build even starts.

## How this was diagnosed
Deployment logs showed the error at the "Installing packages" step, not the "Running TypeScript" step. The local dev environment worked because packages had been installed with `--legacy-peer-deps` flag, but the deployment container ran a clean `npm install` without it.

## Long-term alternative
Pin `styled-components` explicitly to `^5.3.11` in `package.json` devDependencies (v5 has no `react-native` optional peer) — this removes the need for `legacy-peer-deps=true` entirely. Or replace `react-data-table-component` with `@tanstack/react-table` which has no peer dep conflicts.
