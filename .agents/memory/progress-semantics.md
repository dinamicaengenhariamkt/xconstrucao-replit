---
name: Progress semantics by work type
description: Approval and consistency rules for progress updates in owned xgestão work versus marketplace work.
---

Owned xgestão work applies measurement, task, stage, and overall-work progress immediately and atomically. Marketplace measurements remain pending, and any task/stage intent is applied only in the customer approval transaction with finance.

**Why:** Owned work has no customer approval actor, while marketplace work must preserve approval, contestation, notification, and billing semantics. Mixing the two leaves owned work stuck or exposes unapproved marketplace progress.

**How to apply:** Derive the branch server-side from work ownership, serialize all progress writers on the work row, preserve retry IDs, and never trigger customer notifications or automatic finance for owned work.