---
summary: "Behavior and config for group/channel message handling (mentionPatterns are shared across surfaces)"
read_when:
  - Changing group message rules or mentions
title: "Group Messages"
---

# Group messages

Goal: let FoxClaw sit in Slack channels, wake up only when pinged, and keep that thread separate from the personal DM session.

Note: `agents.list[].groupChat.mentionPatterns` is used across all channel surfaces; this doc focuses on Slack-specific behavior. For multi-agent setups, set `agents.list[].groupChat.mentionPatterns` per agent (or use `messages.groupChat.mentionPatterns` as a global fallback).

## What's implemented

- Activation modes: `mention` (default) or `always`. `mention` requires a ping (Slack @-mentions or regex patterns). `always` wakes the agent on every message but it should reply only when it can add meaningful value; otherwise it returns the silent token `NO_REPLY`. Defaults can be set in config (`channels.slack.channels`) and overridden per channel via `/activation`.
- Group policy: `channels.slack.groupPolicy` controls whether channel messages are accepted (`open|disabled|allowlist`). Default is `allowlist` (blocked until you add channels).
- Per-channel sessions: session keys look like `agent:<agentId>:slack:channel:<channelId>` so commands such as `/verbose on` or `/think high` (sent as standalone messages) are scoped to that channel; personal DM state is untouched. Heartbeats are skipped for group threads.
- Context injection: **pending-only** group messages (default 50) that _did not_ trigger a run are prefixed under `[Chat messages since your last reply - for context]`, with the triggering line under `[Current message - respond to this]`. Messages already in the session are not re-injected.
- Sender surfacing: every group batch ends with `[from: Sender Name]` so the model knows who is speaking.

## Config example (Slack)

```json5
{
  channels: {
    slack: {
      channels: {
        "*": { requireMention: true },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          historyLimit: 50,
          mentionPatterns: ["@?foxclaw"],
        },
      },
    ],
  },
}
```

Notes:

- The regexes are case-insensitive.
- Slack sends canonical mentions via the `<@BOTID>` syntax, so pattern fallback is rarely needed but is a useful safety net.

### Activation command (owner-only)

Use the channel command:

- `/activation mention`
- `/activation always`

Send `/status` as a standalone message in the channel to see the current activation mode.

## How to use

1. Add the FoxClaw Slack app to the channel.
2. Mention `@foxclaw` in the channel. Only allowlisted senders can trigger it unless you set `groupPolicy: "open"`.
3. The agent prompt will include recent channel context plus the trailing `[from: ...]` marker so it can address the right person.
4. Session-level directives (`/verbose on`, `/think high`, `/new` or `/reset`, `/compact`) apply only to that channel's session; send them as standalone messages so they register. Your personal DM session remains independent.

## Known considerations

- Heartbeats are intentionally skipped for groups to avoid noisy broadcasts.
- Echo suppression uses the combined batch string; if you send identical text twice without mentions, only the first will get a response.
- Session store entries will appear as `agent:<agentId>:slack:channel:<channelId>` in the session store (`~/.foxclaw/agents/<agentId>/sessions/sessions.json` by default); a missing entry just means the channel hasn't triggered a run yet.
- Typing indicators in groups follow `agents.defaults.typingMode` (default: `message` when unmentioned).
