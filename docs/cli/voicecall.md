---
summary: "CLI reference for `foxclaw voicecall` (voice-call plugin command surface)"
read_when:
  - You use the voice-call plugin and want the CLI entry points
  - You want quick examples for `voicecall call|continue|status|tail|expose`
title: "voicecall"
---

# `foxclaw voicecall`

`voicecall` is a plugin-provided command. It only appears if the voice-call plugin is installed and enabled.

Primary doc:

- Voice-call plugin: [Voice Call](/plugins/voice-call)

## Common commands

```bash
foxclaw voicecall status --call-id <id>
foxclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
foxclaw voicecall continue --call-id <id> --message "Any questions?"
foxclaw voicecall end --call-id <id>
```

## Exposing webhooks (Tailscale)

```bash
foxclaw voicecall expose --mode serve
foxclaw voicecall expose --mode funnel
foxclaw voicecall expose --mode off
```

Security note: only expose the webhook endpoint to networks you trust. Prefer Tailscale Serve over Funnel when possible.
