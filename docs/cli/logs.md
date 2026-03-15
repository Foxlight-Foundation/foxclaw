---
summary: "CLI reference for `foxclaw logs` (tail gateway logs via RPC)"
read_when:
  - You need to tail Gateway logs remotely (without SSH)
  - You want JSON log lines for tooling
title: "logs"
---

# `foxclaw logs`

Tail Gateway file logs over RPC (works in remote mode).

Related:

- Logging overview: [Logging](/logging)

## Examples

```bash
foxclaw logs
foxclaw logs --follow
foxclaw logs --json
foxclaw logs --limit 500
foxclaw logs --local-time
foxclaw logs --follow --local-time
```

Use `--local-time` to render timestamps in your local timezone.
