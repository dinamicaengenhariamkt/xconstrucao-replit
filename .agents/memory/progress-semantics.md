---
name: Progress semantics by work type
description: Approval and consistency rules for progress updates in owned xgestão work versus marketplace work.
---

Owned xgestão work applies measurement, task, stage, and overall-work progress immediately and atomically. Marketplace measurements remain pending, and any task/stage intent is applied only in the customer approval transaction with finance.

**Why:** Owned work has no customer approval actor, while marketplace work must preserve approval, contestation, notification, and billing semantics. Mixing the two leaves owned work stuck or exposes unapproved marketplace progress.

**How to apply:** Derive the branch server-side from work ownership, serialize all progress writers on the work row, preserve retry IDs, and never trigger customer notifications or automatic finance for owned work.

Owned xgestão work also treats the empreiteiro as the owner of stage scope: stage create, rename, update, and delete are allowed. The same empreiteiro remains restricted to progress/status changes on marketplace stages.

**Why:** xgestão has no customer actor to define or maintain the schedule, while marketplace scope remains controlled by the hiring side.

**How to apply:** Gate stage-scope mutations from server-side ownership (`clienteId IS NULL`), never from route names or client flags. Keep task-stage names canonical and reconcile aggregates transactionally on create, move, update, and delete.