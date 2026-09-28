---
name: xgestão browser E2E legal overlay
description: Why role-based locators cannot find protected page controls after certain browser navigations.
---

On freshly invited accounts, the legal-documents dialog may appear on each protected navigation, including after reloading the same work page. Dismissing it with "Agora não" does not persist acceptance. A guided tour can independently mask the underlying page for edit-capable members.

**Why:** Modal dialogs make the background inaccessible to role-based Playwright locators even when its elements are visibly rendered. Waiting for the work hero alone does not prove the tab bar is accessible.

**How to apply:** In browser tests that navigate as a fresh member, handle the legal dialog after each navigation and dismiss any first-visit tour before asserting the page's roles or clicking its tabs. Do not replace role selectors with forced clicks to bypass the overlay.