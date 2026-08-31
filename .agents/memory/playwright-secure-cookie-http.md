---
name: Playwright secure cookie on HTTP
description: Why protected browser tests do not belong in the API project when the local E2E server uses HTTP.
---

Protected browser navigation must not be added to the Playwright `api` project while its local web server runs over HTTP and authentication emits Secure cookies. Keep data-contract coverage in API integration tests and put real navigation in the browser project or an HTTPS-capable runner.

**Why:** API requests can authenticate while Chromium correctly refuses to send the Secure session cookie over HTTP page navigation, making protected page tests unreliable in that project.

**How to apply:** For protected UI, use the browser project in a compatible runner. In the API project, test the endpoint contract and use deterministic component or structural checks for render branches.