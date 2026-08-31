---
name: xgestão navigation context
description: How shared authentication flows preserve the separate xgestão product destination.
---

Shared authentication navigation and administrative shells must receive explicit xgestão product context instead of inferring the active product from the account's primary role or permission scope.

**Why:** An xgestão user remains an `empreiteiro` at the identity layer, while a global admin can deliberately open either product. Role- or scope-only routing cannot distinguish which product initiated a shared transition and visually mixes marketplace operations into xgestão.

**How to apply:** Product entry points must pass xgestão context and use validated internal return paths. In admin UI, the current route selects the visual shell, while `adminEscopo` and server guards independently enforce permission. Global admins may explicitly return to the marketplace; restricted admins may not.