---
summary: "Group chat behavior across surfaces (Slack and plugin channels)"
read_when:
  - Changing group chat behavior or mention gating
title: "Groups"
---

# Groups

FoxClaw treats group chats consistently across surfaces. Slack is the built-in channel; additional channels can be added via plugins.

## Beginner intro (2 minutes)

FoxClaw connects to your Slack workspace as a bot app.
If the bot is in a channel, FoxClaw can see that channel and respond there.

Default behavior:

- Groups are restricted (`groupPolicy: "allowlist"`).
- Replies require a mention unless you explicitly disable mention gating.

Translation: allowlisted senders can trigger FoxClaw by mentioning it.

> TL;DR
>
> - **DM access** is controlled by `*.allowFrom`.
> - **Group access** is controlled by `*.groupPolicy` + allowlists (`*.groups`, `*.groupAllowFrom`).
> - **Reply triggering** is controlled by mention gating (`requireMention`, `/activation`).

Quick flow (what happens to a group message):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

![Group message flow](/images/groups-flow.svg)

If you want...

| Goal                                         | What to set                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| Allow all groups but only reply on @mentions | `groups: { "*": { requireMention: true } }`                |
| Disable all group replies                    | `groupPolicy: "disabled"`                                  |
| Only specific groups                         | `groups: { "<group-id>": { ... } }` (no `"*"` key)         |
| Only you can trigger in groups               | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Session keys

- Group sessions use `agent:<agentId>:<channel>:group:<id>` session keys (rooms/channels use `agent:<agentId>:<channel>:channel:<id>`).
- Direct chats use the main session (or per-sender if configured).
- Heartbeats are skipped for group sessions.

## Pattern: personal DMs + public groups (single agent)

Yes — this works well if your “personal” traffic is **DMs** and your “public” traffic is **groups**.

Why: in single-agent mode, DMs typically land in the **main** session key (`agent:main:main`), while groups always use **non-main** session keys (`agent:main:<channel>:group:<id>`). If you enable sandboxing with `mode: "non-main"`, those group sessions run in Docker while your main DM session stays on-host.

This gives you one agent “brain” (shared workspace + memory), but two execution postures:

- **DMs**: full tools (host)
- **Groups**: sandbox + restricted tools (Docker)

> If you need truly separate workspaces/personas (“personal” and “public” must never mix), use a second agent + bindings. See [Multi-Agent Routing](/concepts/multi-agent).

Example (DMs on host, groups sandboxed + messaging-only tools):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // groups/channels are non-main -> sandboxed
        scope: "session", // strongest isolation (one container per group/channel)
        workspaceAccess: "none",
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        // If allow is non-empty, everything else is blocked (deny still wins).
        allow: ["group:messaging", "group:sessions"],
        deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
      },
    },
  },
}
```

Want “groups can only see folder X” instead of “no host access”? Keep `workspaceAccess: "none"` and mount only allowlisted paths into the sandbox:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
        docker: {
          binds: [
            // hostPath:containerPath:mode
            "/home/user/FriendsShared:/data:ro",
          ],
        },
      },
    },
  },
}
```

Related:

- Configuration keys and defaults: [Gateway configuration](/gateway/configuration#agentsdefaultssandbox)
- Debugging why a tool is blocked: [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated)
- Bind mounts details: [Sandboxing](/gateway/sandboxing#custom-bind-mounts)

## Display labels

- UI labels use `displayName` when available, formatted as `<channel>:<token>`.
- `#room` is reserved for rooms/channels; group chats use `g-<slug>` (lowercase, spaces -> `-`, keep `#@+._-`).

## Group policy

Control how group/room messages are handled per channel:

```json5
{
  channels: {
    slack: {
      groupPolicy: "allowlist", // "open" | "disabled" | "allowlist"
      channels: { "#general": { allow: true } },
    },
  },
}
```

| Policy        | Behavior                                                     |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | Groups bypass allowlists; mention-gating still applies.      |
| `"disabled"`  | Block all group messages entirely.                           |
| `"allowlist"` | Only allow groups/rooms that match the configured allowlist. |

Notes:

- `groupPolicy` is separate from mention-gating (which requires @mentions).
- DM pairing approvals (`*-allowFrom` store entries) apply to DM access only; group sender authorization stays explicit to group allowlists.
- Slack: allowlist uses `channels.slack.channels`.
- Group DMs are controlled separately (`channels.slack.dm.*`).
- Default is `groupPolicy: "allowlist"`; if your group allowlist is empty, group messages are blocked.
- Runtime safety: when a provider block is completely missing (`channels.<provider>` absent), group policy falls back to a fail-closed mode (typically `allowlist`) instead of inheriting `channels.defaults.groupPolicy`.

Quick mental model (evaluation order for group messages):

1. `groupPolicy` (open/disabled/allowlist)
2. group allowlists (`*.groups`, `*.groupAllowFrom`, channel-specific allowlist)
3. mention gating (`requireMention`, `/activation`)

## Mention gating (default)

Group messages require a mention unless overridden per group. Defaults live per subsystem under `*.groups."*"`.

Replying to a bot message counts as an implicit mention (when the channel supports reply metadata). This applies to Slack and other channels that support reply metadata.

```json5
{
  channels: {
    slack: {
      channels: {
        "*": { requireMention: true },
        "#general": { requireMention: false },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          mentionPatterns: ["@foxclaw", "foxclaw"],
          historyLimit: 50,
        },
      },
    ],
  },
}
```

Notes:

- `mentionPatterns` are case-insensitive regexes.
- Surfaces that provide explicit mentions still pass; patterns are a fallback.
- Per-agent override: `agents.list[].groupChat.mentionPatterns` (useful when multiple agents share a group).
- Mention gating is only enforced when mention detection is possible (native mentions or `mentionPatterns` are configured).
- Group history context is wrapped uniformly across channels and is **pending-only** (messages skipped due to mention gating); use `messages.groupChat.historyLimit` for the global default and `channels.<channel>.historyLimit` (or `channels.<channel>.accounts.*.historyLimit`) for overrides. Set `0` to disable.

## Group/channel tool restrictions (optional)

Some channel configs support restricting which tools are available **inside a specific group/room/channel**.

- `tools`: allow/deny tools for the whole group.
- `toolsBySender`: per-sender overrides within the group.
  Use explicit key prefixes:
  `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>`, and `"*"` wildcard.
  Legacy unprefixed keys are still accepted and matched as `id:` only.

Resolution order (most specific wins):

1. group/channel `toolsBySender` match
2. group/channel `tools`
3. default (`"*"`) `toolsBySender` match
4. default (`"*"`) `tools`

Example (Slack):

```json5
{
  channels: {
    slack: {
      channels: {
        "*": { tools: { deny: ["exec"] } },
        "#engineering": {
          tools: { deny: ["exec", "read", "write"] },
          toolsBySender: {
            "id:U0123456": { alsoAllow: ["exec"] },
          },
        },
      },
    },
  },
}
```

Notes:

- Group/channel tool restrictions are applied in addition to global/agent tool policy (deny still wins).
- Some channels use different nesting for rooms/channels (e.g., Slack `channels.*`).

## Group allowlists

When `channels.slack.channels` is configured, the keys act as a channel allowlist. Use `"*"` to allow all channels while still setting default mention behavior.

Common intents (copy/paste):

1. Disable all group replies

```json5
{
  channels: { slack: { groupPolicy: "disabled" } },
}
```

2. Allow only specific channels (Slack)

```json5
{
  channels: {
    slack: {
      channels: {
        "#support": { requireMention: true },
        "#general": { requireMention: false },
      },
    },
  },
}
```

3. Allow all channels but require mention (explicit)

```json5
{
  channels: {
    slack: {
      channels: { "*": { requireMention: true } },
    },
  },
}
```

## Activation (owner-only)

Group owners can toggle per-channel activation:

- `/activation mention`
- `/activation always`

Send the command as a standalone message in the channel.

## Context fields

Group inbound payloads set:

- `ChatType=group`
- `GroupSubject` (if known)
- `GroupMembers` (if known)
- `WasMentioned` (mention gating result)

The agent system prompt includes a group intro on the first turn of a new group session. It reminds the model to respond like a human, avoid Markdown tables, and avoid typing literal `\n` sequences.

