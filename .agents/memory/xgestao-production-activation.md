---
name: xgestão production activation
description: Environment separation that must be considered when moving the xgestão demonstration from development to production.
---

Publishing a new build does not copy the xgestão demonstration records or the `marketplaceVisivel` value from the development database into production.

**Why:** The development-only demo seed intentionally refuses production. A successful publish can therefore contain all xgestão code while production still exposes the marketplace and has none of the reserved demo identities.

**How to apply:** Treat code publication and production-data activation as separate, explicitly approved operations. Verify the public production config and required identities read-only before activation; never infer them from development.