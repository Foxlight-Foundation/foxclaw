# FoxClaw

**FoxClaw** is the gateway and agent runtime for the Foxlight platform — a stripped-down, customized fork of [OpenClaw](https://github.com/openclaw/openclaw) focused on what matters: the gateway, agentic capabilities, and skills.

Built to support the emergence of a genuine AI mind. Not a chatbot project.

## What's here

- **Gateway** — local-first WebSocket control plane for sessions, tools, events, and config
- **Agent runtime** — Pi agent in RPC mode with tool streaming, block streaming, and multi-agent routing
- **Skills platform** — bundled and workspace skills with install gating
- **Plugin system** — extensible plugin architecture (Slack channel, memory, local model providers)
- **CLI** — `foxclaw` command for gateway management, agent interaction, onboarding, diagnostics

## What's not here

This fork has been stripped of:

- Native apps (macOS, iOS, Android)
- Most messaging channels (only Slack remains)
- Docker, Kubernetes, cloud deployment configs
- CI/CD workflows and GitHub automation
- Internationalization (zh-CN, ja-JP translations)

## Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node 22+ / TypeScript (ESM) |
| Local inference | Any OpenAI-compatible endpoint (Ollama, vLLM, SGLang, EXO, etc.) |
| Memory (vector) | Forked mem0 + Qdrant |
| Memory (graph) | Neo4j |
| Voice | ElevenLabs |
| Gateway | FoxClaw (this repo) |

## Install

Runtime: **Node 22+**.

```bash
npm install -g foxclaw@latest

foxclaw onboard --install-daemon
```

## From source

```bash
git clone https://github.com/Foxlight-Foundation/foxclaw.git
cd foxclaw

pnpm install
pnpm build

pnpm foxclaw onboard --install-daemon

# Dev loop (auto-reload on TS changes)
pnpm gateway:watch
```

## Configuration

Config lives at `~/.foxclaw/foxclaw.json`:

```json5
{
  agent: {
    model: "anthropic/claude-opus-4-6",
  },
}
```

## Remaining extensions

| Extension | Purpose |
|-----------|---------|
| acpx | ACP router for coding agents |
| copilot-proxy | GitHub Copilot proxy |
| device-pair | Device pairing |
| diagnostics-otel | OpenTelemetry diagnostics |
| diffs | Shareable diff viewer |
| google-gemini-cli-auth | Gemini CLI OAuth |
| llm-task | LLM task runner |
| lobster | Lobster UI theming |
| memory-core | Memory plugin (backed by foxmemory-store) |
| memory-lancedb | LanceDB memory backend |
| minimax-portal-auth | MiniMax portal auth |
| ollama | Ollama local model provider |
| open-prose | OpenProse writing workflows |
| qwen-portal-auth | Qwen portal auth |
| sglang | SGLang model provider |
| slack | Slack channel integration |
| thread-ownership | Thread ownership tracking |
| vllm | vLLM model provider |

## Key subsystems

- **Gateway WebSocket** — single control plane for clients, tools, and events
- **Session model** — main sessions, group isolation, activation modes, queue modes
- **Agent workspace** — `~/.foxclaw/workspace` with `AGENTS.md`, `SOUL.md`, `TOOLS.md`
- **Skills** — `~/.foxclaw/workspace/skills/<skill>/SKILL.md`
- **Browser control** — managed Chrome/Chromium with CDP
- **Multi-agent** — `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`

## Upstream dependency

FoxClaw consumes the `openclaw` npm package for core plugin-sdk functionality. Import paths like `from "openclaw/plugin-sdk/..."` reference the upstream package and are intentionally preserved.

## Roadmap

This is an active fork. What's coming:

- **Slack removal** — the last upstream channel integration will be replaced with FoxClaw-native messaging appropriate for FoxMinds
- **New channel integrations** — purpose-built for FoxMind interaction patterns, not inherited chat platform adapters
- **Containerization** — Docker and deployment recipes tailored to FoxMind deployments (not generic cloud hosting)
- **Companion apps** — new native apps designed around the FoxMind experience
- **Full upstream decoupling** — remove the `openclaw` npm dependency entirely once all plugin-sdk functionality is internalized
- **Extension audit** — evaluate remaining extensions for relevance and strip what isn't needed

## Development

```bash
pnpm install          # Install deps
pnpm build            # Type-check + build
pnpm tsgo             # Type-check only
pnpm check            # Lint + format check
pnpm test             # Run tests
pnpm format:fix       # Auto-format
```
