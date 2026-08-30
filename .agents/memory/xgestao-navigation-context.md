---
name: xgestão navigation context
description: How shared authentication flows preserve the separate xgestão product destination.
---

Shared authentication navigation must receive explicit xgestão product context instead of inferring the destination from the account's primary role.

**Why:** An xgestão user remains an `empreiteiro` at the identity layer. Role-only routing therefore sends the user into the marketplace and cannot distinguish which product initiated logout or another shared auth transition.

**How to apply:** Product-specific entry points must pass xgestão context and use only validated internal xgestão return paths. Generic contratante, empreiteiro, and administrador flows should continue deriving their destination from the primary role.