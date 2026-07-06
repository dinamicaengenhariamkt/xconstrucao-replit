---
name: Tailwind v4 source scanning and @source none
description: Correct syntax to disable auto-detection in Tailwind v4.1.18 and fix corrupted CSS from agent state files
---

## Rule

In Tailwind v4.1.18, disabling auto-detection (so `.local/` and other agent state dirs are not scanned) requires this syntax in `app/globals.css`:

```css
@import "tailwindcss" source(none);
@source "../app";
@source "../features";
@source "../shared";
@source "../components";
@source "../lib";
@source "../server";
```

**Why:** Tailwind v4's Rust scanner picks up `has-[:disabled]:opacity-50` from agent state files (`.local/state/replit/agent/filesystem/filesystem_state.json`, `transcript.jsonl`), corrupting it to `has-[:di5c????]:opacity-50`, which causes Lightning CSS (used by Turbopack) to fail with a parse error.

**Why the wrong approaches failed:**
- `@source not ".local/**"` — path resolves to `app/.local/**` (wrong base), not root `.local/`
- `@source not "../.local/**"` — seems like correct path but still didn't stop the corruption
- `.local` in `.gitignore` — doesn't help for already git-tracked files
- `@source "none"` (standalone) — NOT valid; adds a useless source named "none" without disabling auto-detection
- `@source none` (unquoted) — causes `CssSyntaxError: @source paths must be quoted`

**How to apply:** Always include `source(none)` in the `@import "tailwindcss"` line of `app/globals.css` for this project. When adding new top-level directories with Tailwind classes, add a corresponding `@source "../<dir>"` line.

**Key discovery:** The `source(none)` keyword in Tailwind v4.1.18 is parsed as part of the `@import` params (not a standalone directive). The internal check is `if(I==="none"){S=I;continue}` in `tailwindcss/dist/lib.js`.
