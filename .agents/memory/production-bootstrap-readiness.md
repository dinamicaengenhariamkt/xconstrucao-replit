---
name: Production bootstrap readiness
description: Keep Autoscale HTTP readiness independent from slow schema and maintenance bootstraps.
---

Production initialization that performs database schema checks, idempotent bootstraps, backfills, or maintenance jobs must not block the first HTTP response used by Autoscale readiness.

**Why:** Next.js reports the server as ready before an awaited instrumentation registration finishes serving requests. A long but successful bootstrap can therefore make every `/` health probe time out until the platform terminates an otherwise healthy container.

**How to apply:** Start production bootstraps asynchronously from instrumentation, log completion, and terminate explicitly on a genuine uncaught bootstrap failure or failed critical schema check. Verify that `/` returns HTTP 200 quickly while bootstrap work is still running.