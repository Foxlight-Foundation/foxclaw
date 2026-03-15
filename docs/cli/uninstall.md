---
summary: "CLI reference for `foxclaw uninstall` (remove gateway service + local data)"
read_when:
  - You want to remove the gateway service and/or local state
  - You want a dry-run first
title: "uninstall"
---

# `foxclaw uninstall`

Uninstall the gateway service + local data (CLI remains).

```bash
foxclaw backup create
foxclaw uninstall
foxclaw uninstall --all --yes
foxclaw uninstall --dry-run
```

Run `foxclaw backup create` first if you want a restorable snapshot before removing state or workspaces.
