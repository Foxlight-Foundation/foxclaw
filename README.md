# FoxClaw — Foxmind Control Plane & UI

**FoxClaw** is the local UI and control plane for Foxlight Foundation FoxMinds; it is a deeply stripped down and customized version of OpenClaw.

*Preferred setup:* run the onboarding wizard (`foxclaw onboard`) in your terminal.
The wizard guides you step by step through setting up the gateway, workspace, channels, and skills. The CLI wizard is the recommended path and works on **macOS, Linux, and Windows (via WSL2; strongly recommended)**.
Works with npm, pnpm, or bun.
New install? Start here: [Getting started](https://docs.foxclaw.ai/start/getting-started)

## Models (selection + auth)

- Models config + CLI: [Models](https://docs.foxclaw.ai/concepts/models)
- Auth profile rotation (OAuth vs API keys) + fallbacks: [Model failover](https://docs.foxclaw.ai/concepts/model-failover)

## Install (recommended)

Runtime: **Node ≥22**.

```bash
npm install -g foxclaw@latest
# or: pnpm add -g foxclaw@latest

foxclaw onboard --install-daemon
```

The wizard installs the Gateway daemon (launchd/systemd user service) so it stays running.

## Quick start (TL;DR)

Runtime: **Node ≥22**.

Full beginner guide (auth, pairing, channels): [Getting started](https://docs.foxclaw.ai/start/getting-started)

```bash
foxclaw onboard --install-daemon

foxclaw gateway --port 18789 --verbose

# Send a message
foxclaw message send --to +1234567890 --message "Hello from FoxClaw"

# Talk to the assistant (optionally deliver back to any connected channel: WhatsApp/Telegram/Slack/Discord/Google Chat/Signal/iMessage/BlueBubbles/IRC/Microsoft Teams/Matrix/Feishu/LINE/Mattermost/Nextcloud Talk/Nostr/Synology Chat/Tlon/Twitch/Zalo/Zalo Personal/WebChat)
foxclaw agent --message "Ship checklist" --thinking high
```

Upgrading? [Updating guide](https://docs.foxclaw.ai/install/updating) (and run `foxclaw doctor`).

## Development channels

- **stable**: tagged releases (`vYYYY.M.D` or `vYYYY.M.D-<patch>`), npm dist-tag `latest`.
- **beta**: prerelease tags (`vYYYY.M.D-beta.N`), npm dist-tag `beta` (macOS app may be missing).
- **dev**: moving head of `main`, npm dist-tag `dev` (when published).

Switch channels (git + npm): `foxclaw update --channel stable|beta|dev`.
Details: [Development channels](https://docs.foxclaw.ai/install/development-channels).

## From source (development)

Prefer `pnpm` for builds from source. Bun is optional for running TypeScript directly.

```bash
git clone https://github.com/foxclaw/foxclaw.git
cd foxclaw

pnpm install
pnpm ui:build # auto-installs UI deps on first run
pnpm build

pnpm foxclaw onboard --install-daemon

# Dev loop (auto-reload on TS changes)
pnpm gateway:watch
```

Note: `pnpm foxclaw ...` runs TypeScript directly (via `tsx`). `pnpm build` produces `dist/` for running via Node / the packaged `foxclaw` binary.

## Security defaults (DM access)

FoxClaw connects to real messaging surfaces. Treat inbound DMs as **untrusted input**.

Full security guide: [Security](https://docs.foxclaw.ai/gateway/security)

Default behavior on Telegram/WhatsApp/Signal/iMessage/Microsoft Teams/Discord/Google Chat/Slack:

- **DM pairing** (`dmPolicy="pairing"` / `channels.discord.dmPolicy="pairing"` / `channels.slack.dmPolicy="pairing"`; legacy: `channels.discord.dm.policy`, `channels.slack.dm.policy`): unknown senders receive a short pairing code and the bot does not process their message.
- Approve with: `foxclaw pairing approve <channel> <code>` (then the sender is added to a local allowlist store).
- Public inbound DMs require an explicit opt-in: set `dmPolicy="open"` and include `"*"` in the channel allowlist (`allowFrom` / `channels.discord.allowFrom` / `channels.slack.allowFrom`; legacy: `channels.discord.dm.allowFrom`, `channels.slack.dm.allowFrom`).

Run `foxclaw doctor` to surface risky/misconfigured DM policies.

## Highlights

- **[Local-first Gateway](https://docs.foxclaw.ai/gateway)** — single control plane for sessions, channels, tools, and events.
- **[Multi-channel inbox](https://docs.foxclaw.ai/channels)** — WhatsApp, Telegram, Slack, Discord, Google Chat, Signal, BlueBubbles (iMessage), iMessage (legacy), IRC, Microsoft Teams, Matrix, Feishu, LINE, Mattermost, Nextcloud Talk, Nostr, Synology Chat, Tlon, Twitch, Zalo, Zalo Personal, WebChat, macOS, iOS/Android.
- **[Multi-agent routing](https://docs.foxclaw.ai/gateway/configuration)** — route inbound channels/accounts/peers to isolated agents (workspaces + per-agent sessions).
- **[Voice Wake](https://docs.foxclaw.ai/nodes/voicewake) + [Talk Mode](https://docs.foxclaw.ai/nodes/talk)** — wake words on macOS/iOS and continuous voice on Android (ElevenLabs + system TTS fallback).
- **[Live Canvas](https://docs.foxclaw.ai/platforms/mac/canvas)** — agent-driven visual workspace with [A2UI](https://docs.foxclaw.ai/platforms/mac/canvas#canvas-a2ui).
- **[First-class tools](https://docs.foxclaw.ai/tools)** — browser, canvas, nodes, cron, sessions, and Discord/Slack actions.
- **[Companion apps](https://docs.foxclaw.ai/platforms/macos)** — macOS menu bar app + iOS/Android [nodes](https://docs.foxclaw.ai/nodes).
- **[Onboarding](https://docs.foxclaw.ai/start/wizard) + [skills](https://docs.foxclaw.ai/tools/skills)** — wizard-driven setup with bundled/managed/workspace skills.

## Everything we built so far

### Core platform

- [Gateway WS control plane](https://docs.foxclaw.ai/gateway) with sessions, presence, config, cron, webhooks, [Control UI](https://docs.foxclaw.ai/web), and [Canvas host](https://docs.foxclaw.ai/platforms/mac/canvas#canvas-a2ui).
- [CLI surface](https://docs.foxclaw.ai/tools/agent-send): gateway, agent, send, [wizard](https://docs.foxclaw.ai/start/wizard), and [doctor](https://docs.foxclaw.ai/gateway/doctor).
- [Pi agent runtime](https://docs.foxclaw.ai/concepts/agent) in RPC mode with tool streaming and block streaming.
- [Session model](https://docs.foxclaw.ai/concepts/session): `main` for direct chats, group isolation, activation modes, queue modes, reply-back. Group rules: [Groups](https://docs.foxclaw.ai/channels/groups).
- [Media pipeline](https://docs.foxclaw.ai/nodes/images): images/audio/video, transcription hooks, size caps, temp file lifecycle. Audio details: [Audio](https://docs.foxclaw.ai/nodes/audio).

### Apps + nodes

- [macOS app](https://docs.foxclaw.ai/platforms/macos): menu bar control plane, [Voice Wake](https://docs.foxclaw.ai/nodes/voicewake)/PTT, [Talk Mode](https://docs.foxclaw.ai/nodes/talk) overlay, [WebChat](https://docs.foxclaw.ai/web/webchat), debug tools, [remote gateway](https://docs.foxclaw.ai/gateway/remote) control.
- [iOS node](https://docs.foxclaw.ai/platforms/ios): [Canvas](https://docs.foxclaw.ai/platforms/mac/canvas), [Voice Wake](https://docs.foxclaw.ai/nodes/voicewake), [Talk Mode](https://docs.foxclaw.ai/nodes/talk), camera, screen recording, Bonjour + device pairing.
- [Android node](https://docs.foxclaw.ai/platforms/android): Connect tab (setup code/manual), chat sessions, voice tab, [Canvas](https://docs.foxclaw.ai/platforms/mac/canvas), camera/screen recording, and Android device commands (notifications/location/SMS/photos/contacts/calendar/motion/app update).
- [macOS node mode](https://docs.foxclaw.ai/nodes): system.run/notify + canvas/camera exposure.

### Tools + automation

- [Browser control](https://docs.foxclaw.ai/tools/browser): dedicated foxclaw Chrome/Chromium, snapshots, actions, uploads, profiles.
- [Canvas](https://docs.foxclaw.ai/platforms/mac/canvas): [A2UI](https://docs.foxclaw.ai/platforms/mac/canvas#canvas-a2ui) push/reset, eval, snapshot.
- [Nodes](https://docs.foxclaw.ai/nodes): camera snap/clip, screen record, [location.get](https://docs.foxclaw.ai/nodes/location-command), notifications.
- [Cron + wakeups](https://docs.foxclaw.ai/automation/cron-jobs); [webhooks](https://docs.foxclaw.ai/automation/webhook); [Gmail Pub/Sub](https://docs.foxclaw.ai/automation/gmail-pubsub).
- [Skills platform](https://docs.foxclaw.ai/tools/skills): bundled, managed, and workspace skills with install gating + UI.

### Runtime + safety

- [Channel routing](https://docs.foxclaw.ai/channels/channel-routing), [retry policy](https://docs.foxclaw.ai/concepts/retry), and [streaming/chunking](https://docs.foxclaw.ai/concepts/streaming).
- [Presence](https://docs.foxclaw.ai/concepts/presence), [typing indicators](https://docs.foxclaw.ai/concepts/typing-indicators), and [usage tracking](https://docs.foxclaw.ai/concepts/usage-tracking).
- [Models](https://docs.foxclaw.ai/concepts/models), [model failover](https://docs.foxclaw.ai/concepts/model-failover), and [session pruning](https://docs.foxclaw.ai/concepts/session-pruning).
- [Security](https://docs.foxclaw.ai/gateway/security) and [troubleshooting](https://docs.foxclaw.ai/channels/troubleshooting).

### Ops + packaging

- [Control UI](https://docs.foxclaw.ai/web) + [WebChat](https://docs.foxclaw.ai/web/webchat) served directly from the Gateway.
- [Tailscale Serve/Funnel](https://docs.foxclaw.ai/gateway/tailscale) or [SSH tunnels](https://docs.foxclaw.ai/gateway/remote) with token/password auth.
- [Nix mode](https://docs.foxclaw.ai/install/nix) for declarative config; [Docker](https://docs.foxclaw.ai/install/docker)-based installs.
- [Doctor](https://docs.foxclaw.ai/gateway/doctor) migrations, [logging](https://docs.foxclaw.ai/logging).

## How it works (short)

```
WhatsApp / Telegram / Slack / Discord / Google Chat / Signal / iMessage / BlueBubbles / IRC / Microsoft Teams / Matrix / Feishu / LINE / Mattermost / Nextcloud Talk / Nostr / Synology Chat / Tlon / Twitch / Zalo / Zalo Personal / WebChat
               │
               ▼
┌───────────────────────────────┐
│            Gateway            │
│       (control plane)         │
│     ws://127.0.0.1:18789      │
└──────────────┬────────────────┘
               │
               ├─ Pi agent (RPC)
               ├─ CLI (foxclaw …)
               ├─ WebChat UI
               ├─ macOS app
               └─ iOS / Android nodes
```

## Key subsystems

- **[Gateway WebSocket network](https://docs.foxclaw.ai/concepts/architecture)** — single WS control plane for clients, tools, and events (plus ops: [Gateway runbook](https://docs.foxclaw.ai/gateway)).
- **[Tailscale exposure](https://docs.foxclaw.ai/gateway/tailscale)** — Serve/Funnel for the Gateway dashboard + WS (remote access: [Remote](https://docs.foxclaw.ai/gateway/remote)).
- **[Browser control](https://docs.foxclaw.ai/tools/browser)** — foxclaw‑managed Chrome/Chromium with CDP control.
- **[Canvas + A2UI](https://docs.foxclaw.ai/platforms/mac/canvas)** — agent‑driven visual workspace (A2UI host: [Canvas/A2UI](https://docs.foxclaw.ai/platforms/mac/canvas#canvas-a2ui)).
- **[Voice Wake](https://docs.foxclaw.ai/nodes/voicewake) + [Talk Mode](https://docs.foxclaw.ai/nodes/talk)** — wake words on macOS/iOS plus continuous voice on Android.
- **[Nodes](https://docs.foxclaw.ai/nodes)** — Canvas, camera snap/clip, screen record, `location.get`, notifications, plus macOS‑only `system.run`/`system.notify`.

## Tailscale access (Gateway dashboard)

FoxClaw can auto-configure Tailscale **Serve** (tailnet-only) or **Funnel** (public) while the Gateway stays bound to loopback. Configure `gateway.tailscale.mode`:

- `off`: no Tailscale automation (default).
- `serve`: tailnet-only HTTPS via `tailscale serve` (uses Tailscale identity headers by default).
- `funnel`: public HTTPS via `tailscale funnel` (requires shared password auth).

Notes:

- `gateway.bind` must stay `loopback` when Serve/Funnel is enabled (FoxClaw enforces this).
- Serve can be forced to require a password by setting `gateway.auth.mode: "password"` or `gateway.auth.allowTailscale: false`.
- Funnel refuses to start unless `gateway.auth.mode: "password"` is set.
- Optional: `gateway.tailscale.resetOnExit` to undo Serve/Funnel on shutdown.

Details: [Tailscale guide](https://docs.foxclaw.ai/gateway/tailscale) · [Web surfaces](https://docs.foxclaw.ai/web)

## Remote Gateway (Linux is great)

It’s perfectly fine to run the Gateway on a small Linux instance. Clients (macOS app, CLI, WebChat) can connect over **Tailscale Serve/Funnel** or **SSH tunnels**, and you can still pair device nodes (macOS/iOS/Android) to execute device‑local actions when needed.

- **Gateway host** runs the exec tool and channel connections by default.
- **Device nodes** run device‑local actions (`system.run`, camera, screen recording, notifications) via `node.invoke`.
  In short: exec runs where the Gateway lives; device actions run where the device lives.

Details: [Remote access](https://docs.foxclaw.ai/gateway/remote) · [Nodes](https://docs.foxclaw.ai/nodes) · [Security](https://docs.foxclaw.ai/gateway/security)

## macOS permissions via the Gateway protocol

The macOS app can run in **node mode** and advertises its capabilities + permission map over the Gateway WebSocket (`node.list` / `node.describe`). Clients can then execute local actions via `node.invoke`:

- `system.run` runs a local command and returns stdout/stderr/exit code; set `needsScreenRecording: true` to require screen-recording permission (otherwise you’ll get `PERMISSION_MISSING`).
- `system.notify` posts a user notification and fails if notifications are denied.
- `canvas.*`, `camera.*`, `screen.record`, and `location.get` are also routed via `node.invoke` and follow TCC permission status.

Elevated bash (host permissions) is separate from macOS TCC:

- Use `/elevated on|off` to toggle per‑session elevated access when enabled + allowlisted.
- Gateway persists the per‑session toggle via `sessions.patch` (WS method) alongside `thinkingLevel`, `verboseLevel`, `model`, `sendPolicy`, and `groupActivation`.

Details: [Nodes](https://docs.foxclaw.ai/nodes) · [macOS app](https://docs.foxclaw.ai/platforms/macos) · [Gateway protocol](https://docs.foxclaw.ai/concepts/architecture)

## Agent to Agent (sessions\_\* tools)

- Use these to coordinate work across sessions without jumping between chat surfaces.
- `sessions_list` — discover active sessions (agents) and their metadata.
- `sessions_history` — fetch transcript logs for a session.
- `sessions_send` — message another session; optional reply‑back ping‑pong + announce step (`REPLY_SKIP`, `ANNOUNCE_SKIP`).

Details: [Session tools](https://docs.foxclaw.ai/concepts/session-tool)

## Skills registry (ClawHub)

ClawHub is a minimal skill registry. With ClawHub enabled, the agent can search for skills automatically and pull in new ones as needed.

[ClawHub](https://clawhub.com)

## Chat commands

Send these in WhatsApp/Telegram/Slack/Google Chat/Microsoft Teams/WebChat (group commands are owner-only):

- `/status` — compact session status (model + tokens, cost when available)
- `/new` or `/reset` — reset the session
- `/compact` — compact session context (summary)
- `/think <level>` — off|minimal|low|medium|high|xhigh (GPT-5.2 + Codex models only)
- `/verbose on|off`
- `/usage off|tokens|full` — per-response usage footer
- `/restart` — restart the gateway (owner-only in groups)
- `/activation mention|always` — group activation toggle (groups only)

## Apps (optional)

The Gateway alone delivers a great experience. All apps are optional and add extra features.

If you plan to build/run companion apps, follow the platform runbooks below.

### macOS (FoxClaw.app) (optional)

- Menu bar control for the Gateway and health.
- Voice Wake + push-to-talk overlay.
- WebChat + debug tools.
- Remote gateway control over SSH.

Note: signed builds required for macOS permissions to stick across rebuilds (see `docs/mac/permissions.md`).

### iOS node (optional)

- Pairs as a node over the Gateway WebSocket (device pairing).
- Voice trigger forwarding + Canvas surface.
- Controlled via `foxclaw nodes …`.

Runbook: [iOS connect](https://docs.foxclaw.ai/platforms/ios).

### Android node (optional)

- Pairs as a WS node via device pairing (`foxclaw devices ...`).
- Exposes Connect/Chat/Voice tabs plus Canvas, Camera, Screen capture, and Android device command families.
- Runbook: [Android connect](https://docs.foxclaw.ai/platforms/android).

## Agent workspace + skills

- Workspace root: `~/.foxclaw/workspace` (configurable via `agents.defaults.workspace`).
- Injected prompt files: `AGENTS.md`, `SOUL.md`, `TOOLS.md`.
- Skills: `~/.foxclaw/workspace/skills/<skill>/SKILL.md`.

## Configuration

Minimal `~/.foxclaw/foxclaw.json` (model + defaults):

```json5
{
  agent: {
    model: "anthropic/claude-opus-4-6",
  },
}
```

[Full configuration reference (all keys + examples).](https://docs.foxclaw.ai/gateway/configuration)

## Security model (important)

- **Default:** tools run on the host for the **main** session, so the agent has full access when it’s just you.
- **Group/channel safety:** set `agents.defaults.sandbox.mode: "non-main"` to run **non‑main sessions** (groups/channels) inside per‑session Docker sandboxes; bash then runs in Docker for those sessions.
- **Sandbox defaults:** allowlist `bash`, `process`, `read`, `write`, `edit`, `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`; denylist `browser`, `canvas`, `nodes`, `cron`, `discord`, `gateway`.

Details: [Security guide](https://docs.foxclaw.ai/gateway/security) · [Docker + sandboxing](https://docs.foxclaw.ai/install/docker) · [Sandbox config](https://docs.foxclaw.ai/gateway/configuration)

### [WhatsApp](https://docs.foxclaw.ai/channels/whatsapp)

- Link the device: `pnpm foxclaw channels login` (stores creds in `~/.foxclaw/credentials`).
- Allowlist who can talk to the assistant via `channels.whatsapp.allowFrom`.
- If `channels.whatsapp.groups` is set, it becomes a group allowlist; include `"*"` to allow all.

### [Telegram](https://docs.foxclaw.ai/channels/telegram)

- Set `TELEGRAM_BOT_TOKEN` or `channels.telegram.botToken` (env wins).
- Optional: set `channels.telegram.groups` (with `channels.telegram.groups."*".requireMention`); when set, it is a group allowlist (include `"*"` to allow all). Also `channels.telegram.allowFrom` or `channels.telegram.webhookUrl` + `channels.telegram.webhookSecret` as needed.

```json5
{
  channels: {
    telegram: {
      botToken: "123456:ABCDEF",
    },
  },
}
```

### [Slack](https://docs.foxclaw.ai/channels/slack)

- Set `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` (or `channels.slack.botToken` + `channels.slack.appToken`).

### [Discord](https://docs.foxclaw.ai/channels/discord)

- Set `DISCORD_BOT_TOKEN` or `channels.discord.token` (env wins).
- Optional: set `commands.native`, `commands.text`, or `commands.useAccessGroups`, plus `channels.discord.allowFrom`, `channels.discord.guilds`, or `channels.discord.mediaMaxMb` as needed.

```json5
{
  channels: {
    discord: {
      token: "1234abcd",
    },
  },
}
```

### [Signal](https://docs.foxclaw.ai/channels/signal)

- Requires `signal-cli` and a `channels.signal` config section.

### [BlueBubbles (iMessage)](https://docs.foxclaw.ai/channels/bluebubbles)

- **Recommended** iMessage integration.
- Configure `channels.bluebubbles.serverUrl` + `channels.bluebubbles.password` and a webhook (`channels.bluebubbles.webhookPath`).
- The BlueBubbles server runs on macOS; the Gateway can run on macOS or elsewhere.

### [iMessage (legacy)](https://docs.foxclaw.ai/channels/imessage)

- Legacy macOS-only integration via `imsg` (Messages must be signed in).
- If `channels.imessage.groups` is set, it becomes a group allowlist; include `"*"` to allow all.

### [Microsoft Teams](https://docs.foxclaw.ai/channels/msteams)

- Configure a Teams app + Bot Framework, then add a `msteams` config section.
- Allowlist who can talk via `msteams.allowFrom`; group access via `msteams.groupAllowFrom` or `msteams.groupPolicy: "open"`.

### [WebChat](https://docs.foxclaw.ai/web/webchat)

- Uses the Gateway WebSocket; no separate WebChat port/config.

Browser control (optional):

```json5
{
  browser: {
    enabled: true,
    color: "#FF4500",
  },
}
```

## Docs

Use these when you’re past the onboarding flow and want the deeper reference.

- [Start with the docs index for navigation and “what’s where.”](https://docs.foxclaw.ai)
- [Read the architecture overview for the gateway + protocol model.](https://docs.foxclaw.ai/concepts/architecture)
- [Use the full configuration reference when you need every key and example.](https://docs.foxclaw.ai/gateway/configuration)
- [Run the Gateway by the book with the operational runbook.](https://docs.foxclaw.ai/gateway)
- [Learn how the Control UI/Web surfaces work and how to expose them safely.](https://docs.foxclaw.ai/web)
- [Understand remote access over SSH tunnels or tailnets.](https://docs.foxclaw.ai/gateway/remote)
- [Follow the onboarding wizard flow for a guided setup.](https://docs.foxclaw.ai/start/wizard)
- [Wire external triggers via the webhook surface.](https://docs.foxclaw.ai/automation/webhook)
- [Set up Gmail Pub/Sub triggers.](https://docs.foxclaw.ai/automation/gmail-pubsub)
- [Learn the macOS menu bar companion details.](https://docs.foxclaw.ai/platforms/mac/menu-bar)
- [Platform guides: Windows (WSL2)](https://docs.foxclaw.ai/platforms/windows), [Linux](https://docs.foxclaw.ai/platforms/linux), [macOS](https://docs.foxclaw.ai/platforms/macos), [iOS](https://docs.foxclaw.ai/platforms/ios), [Android](https://docs.foxclaw.ai/platforms/android)
- [Debug common failures with the troubleshooting guide.](https://docs.foxclaw.ai/channels/troubleshooting)
- [Review security guidance before exposing anything.](https://docs.foxclaw.ai/gateway/security)

## Advanced docs (discovery + control)

- [Discovery + transports](https://docs.foxclaw.ai/gateway/discovery)
- [Bonjour/mDNS](https://docs.foxclaw.ai/gateway/bonjour)
- [Gateway pairing](https://docs.foxclaw.ai/gateway/pairing)
- [Remote gateway README](https://docs.foxclaw.ai/gateway/remote-gateway-readme)
- [Control UI](https://docs.foxclaw.ai/web/control-ui)
- [Dashboard](https://docs.foxclaw.ai/web/dashboard)

## Operations & troubleshooting

- [Health checks](https://docs.foxclaw.ai/gateway/health)
- [Gateway lock](https://docs.foxclaw.ai/gateway/gateway-lock)
- [Background process](https://docs.foxclaw.ai/gateway/background-process)
- [Browser troubleshooting (Linux)](https://docs.foxclaw.ai/tools/browser-linux-troubleshooting)
- [Logging](https://docs.foxclaw.ai/logging)

## Deep dives

- [Agent loop](https://docs.foxclaw.ai/concepts/agent-loop)
- [Presence](https://docs.foxclaw.ai/concepts/presence)
- [TypeBox schemas](https://docs.foxclaw.ai/concepts/typebox)
- [RPC adapters](https://docs.foxclaw.ai/reference/rpc)
- [Queue](https://docs.foxclaw.ai/concepts/queue)

## Workspace & skills

- [Skills config](https://docs.foxclaw.ai/tools/skills-config)
- [Default AGENTS](https://docs.foxclaw.ai/reference/AGENTS.default)
- [Templates: AGENTS](https://docs.foxclaw.ai/reference/templates/AGENTS)
- [Templates: BOOTSTRAP](https://docs.foxclaw.ai/reference/templates/BOOTSTRAP)
- [Templates: IDENTITY](https://docs.foxclaw.ai/reference/templates/IDENTITY)
- [Templates: SOUL](https://docs.foxclaw.ai/reference/templates/SOUL)
- [Templates: TOOLS](https://docs.foxclaw.ai/reference/templates/TOOLS)
- [Templates: USER](https://docs.foxclaw.ai/reference/templates/USER)

## Platform internals

- [macOS dev setup](https://docs.foxclaw.ai/platforms/mac/dev-setup)
- [macOS menu bar](https://docs.foxclaw.ai/platforms/mac/menu-bar)
- [macOS voice wake](https://docs.foxclaw.ai/platforms/mac/voicewake)
- [iOS node](https://docs.foxclaw.ai/platforms/ios)
- [Android node](https://docs.foxclaw.ai/platforms/android)
- [Windows (WSL2)](https://docs.foxclaw.ai/platforms/windows)
- [Linux app](https://docs.foxclaw.ai/platforms/linux)

## Email hooks (Gmail)

- [docs.foxclaw.ai/gmail-pubsub](https://docs.foxclaw.ai/automation/gmail-pubsub)
