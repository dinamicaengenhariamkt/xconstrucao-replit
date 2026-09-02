---
name: Public work media revocation
description: Accepted security and availability trade-off for xgestão public-work image URLs.
---

Public xgestão work links validate their capability before rendering, then issue signed media URLs valid for 12 hours. Revoking, expiring, or disabling the entitlement makes the public work page return its indistinguishable 404 immediately, but a previously copied signed image URL can remain usable until that short URL expires. A cover is public only when uploaded explicitly as a work cover or when it is a same-work gallery photo approved for external/client sharing.

**Why:** This is the explicit XG04 v1 trade-off. It keeps images stable during a long client viewing session without making storage objects permanently public or adding a media-proxy route. Selecting an unapproved private gallery photo as a cover must not silently bypass the gallery's sharing state.

**How to apply:** Keep the public projection restricted to the approved, obra-scoped media allowlist and regenerate URLs on each public page request. Treat explicit cover uploads and approved same-work gallery photos as distinct allowed sources. Do not shorten the lifetime or add a revocable media proxy unless there is an explicit product/security decision to change this trade-off.