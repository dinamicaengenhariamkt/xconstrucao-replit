---
name: xgestão subscription isolation
description: Product-boundary rule for subscriptions, billing status, and marketplace limits.
---

xgestão subscriptions must always be handled independently from marketplace subscriptions. The legacy marketplace tier remains the authority for marketplace limits; xgestão resolves its tier from its own subscription.

**Why:** A single account can pay for both products. Letting lifecycle events, status lookups, or cancellation of one product inspect or write the other causes accidental access grants or revocations.

**How to apply:** Whenever handling a subscription, derive and filter its product persona. Only marketplace lifecycle paths may update the legacy marketplace tier; xgestão lifecycle paths must leave it unchanged.