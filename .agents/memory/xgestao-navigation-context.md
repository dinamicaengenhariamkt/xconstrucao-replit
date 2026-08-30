---
name: xgestão navigation context
description: How shared authentication flows preserve the separate xgestão product destination.
---

Shared authentication navigation must receive explicit xgestão product context instead of inferring the destination from the account's primary role.

**Why:** An xgestão user remains an `empreiteiro` at the identity layer. Role-only routing therefore sends the user into the marketplace and cannot distinguish which product initiated logout or another shared auth transition.

**How to apply:** Product-specific entry points must pass xgestão context and use only validated internal xgestão return paths. Restricted administrators must also propagate `adminEscopo` through password and OAuth post-login routing; global admins and superadmins keep the full admin destination.