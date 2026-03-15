---
summary: "CLI reference for `foxclaw reset` (reset local state/config)"
read_when:
  - You want to wipe local state while keeping the CLI installed
  - You want a dry-run of what would be removed
title: "reset"
---

# `foxclaw reset`

Reset local config/state (keeps the CLI installed).

```bash
foxclaw backup create
foxclaw reset
foxclaw reset --dry-run
foxclaw reset --scope config+creds+sessions --yes --non-interactive
```

Run `foxclaw backup create` first if you want a restorable snapshot before removing local state.
