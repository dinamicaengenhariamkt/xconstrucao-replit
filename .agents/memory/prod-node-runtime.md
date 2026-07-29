---
name: Production runtime has no Nix node
description: Why deployments must bundle node via the npm "node" package instead of relying on Nix/PATH
---
The Replit production (autoscale/Cloud Run) runtime container for this project does NOT expose the Nix store node: `npm`/`node` are not on PATH, and even a Nix-store path to node captured during build (`which node > .node-path`) does not exist at runtime.

**Why:** Multiple failed publishes (July 2026) proved PATH tricks, /etc/profile sourcing, `find /nix/store`, and build-time path capture all fail in the prod container.

**How to apply:** Keep `node` (npm package, pinned exact, in dependencies) installed — it ships a glibc-linked node binary at `node_modules/node/bin/node` that travels inside the image. `scripts/start-prod.sh` prefers it and prints container diagnostics if startup fails. Build command must also keep the image under 8 GiB (`rm -rf .next/cache .git .next-e2e tmp .cache`).
