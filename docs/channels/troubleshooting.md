---
summary: "Fast channel level troubleshooting with per channel failure signatures and fixes"
read_when:
  - Channel transport says connected but replies fail
  - You need channel specific checks before deep provider docs
title: "Channel Troubleshooting"
---

# Channel troubleshooting

Use this page when a channel connects but behavior is wrong.

## Command ladder

Run these in order first:

```bash
foxclaw status
foxclaw gateway status
foxclaw logs --follow
foxclaw doctor
foxclaw channels status --probe
```

Healthy baseline:

- `Runtime: running`
- `RPC probe: ok`
- Channel probe shows connected/ready

## Slack

### Slack failure signatures

| Symptom                                | Fastest check                             | Fix                                               |
| -------------------------------------- | ----------------------------------------- | ------------------------------------------------- |
| Socket mode connected but no responses | `foxclaw channels status --probe`        | Verify app token + bot token and required scopes. |
| DMs blocked                            | `foxclaw pairing list slack`             | Approve pairing or relax DM policy.               |
| Channel message ignored                | Check `groupPolicy` and channel allowlist | Allow the channel or switch policy to `open`.     |

Full troubleshooting: [/channels/slack#troubleshooting](/channels/slack#troubleshooting)

## Plugin channels

If you have additional channels installed via plugins, check the plugin's own documentation for channel-specific troubleshooting steps. The command ladder above applies to all channels.
