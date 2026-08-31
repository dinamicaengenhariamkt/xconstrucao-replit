---
name: Production runtime has no Nix node
description: Why deployments must bundle node via the npm "node" package instead of relying on Nix/PATH
---
The Replit production (autoscale/Cloud Run) runtime container for this project does NOT expose the Nix store node: `npm`/`node` are not on PATH, and even a Nix-store path to node captured during build (`which node > .node-path`) does not exist at runtime.

Autoscale can also inject `HOSTNAME` as the public service domain. Next standalone interprets `HOSTNAME` as a local bind address, so passing the platform value through causes `EADDRNOTAVAIL` and a health-check crash loop.

**Why:** Multiple failed publishes proved PATH tricks, /etc/profile sourcing, `find /nix/store`, and build-time path capture all fail in the prod container. A later publish built successfully but crashed because the public hostname resolved to an IP not assigned inside the container.

**How to apply:** Keep `node` (npm package, pinned exact, in dependencies) installed — it ships a glibc-linked node binary at `node_modules/node/bin/node` that travels inside the image. Because Next is configured with `output: "standalone"`, production must execute `.next/standalone/server.js`, not `next start`, and the build must copy `.next/static` plus `public` into the standalone tree. Always bind standalone to `0.0.0.0` (or an explicit bind-only variable), never to the inherited `HOSTNAME`. `scripts/start-prod.sh` prefers the bundled Node and prints container diagnostics if startup fails. Keep the image under 8 GiB (`rm -rf .next/cache .git .next-e2e tmp .cache`).
