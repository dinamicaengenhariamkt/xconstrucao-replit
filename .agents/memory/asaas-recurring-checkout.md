---
name: Asaas recurring checkout contract
description: Non-obvious requirements verified against the live Asaas sandbox for hosted recurring checkouts.
---

Use `billingTypes: ["CREDIT_CARD"]`, `chargeTypes: ["RECURRENT"]`, and a `subscription` object containing `cycle` and `nextDueDate`. The current API can return only a checkout ID, so construct the hosted URL from that ID when no URL is returned.

Do not send a saved `customer` unless its Asaas record has every field required by Checkout, including phone and address. When the local product cannot provide the complete Asaas address shape, omit both `customer` and `customerData` so the hosted page collects the missing payer data.

**Why:** Live sandbox validation accepted the recurring fields but rejected incomplete customers successively for missing phone and address. Omitting customer data is explicitly supported and produced a valid hosted checkout. Sandbox checkout items must also be at least R$ 5.

**How to apply:** Keep association through `externalReference`; obtain the actual customer and subscription IDs from payment/subscription webhooks after the payer completes Checkout.