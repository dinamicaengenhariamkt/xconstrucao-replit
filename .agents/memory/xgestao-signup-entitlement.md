---
name: xgestão signup entitlement
description: Product-entry rule for creating an xgestão account without changing marketplace identity.
---

An xgestão signup must create or retain `empreiteiro` as the account's primary role and grant `xgestao` only as an additional entitlement. OAuth must apply that entitlement only to a first-time signup, never because an existing user merely visits the xgestão login screen.

**Why:** The product shares its operational identity with empreiteiro, but xgestão access is a separate product boundary. Promoting an existing marketplace account just from a login route would silently grant product access.

**How to apply:** Preserve this mapping in every signup provider and onboarding entry. New xgestão accounts may start with the xgestão entitlement; existing accounts must receive it only through the explicit entitlement flow.