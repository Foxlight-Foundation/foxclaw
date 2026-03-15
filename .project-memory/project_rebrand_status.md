---
name: foxclaw-rebrand-status
description: Current status of the openclaw → foxclaw rebrand and codebase slimming as of 2026-03-15
type: project
---

## Rebrand Status (2026-03-15)

### Completed
- Stripped: native apps (iOS/Android/macOS), Docker/cloud deploy, CI/CD, GitHub automation
- Stripped: 22 channel extensions (kept only Slack), phone-control extension
- Stripped: 19 skills, zh-CN/ja-JP translations, orphaned docs and assets
- Rebranded: docs, comments, env vars (FOXCLAW_*), config paths (~/.foxclaw/foxclaw.json), plugin manifests (foxclaw.plugin.json), file renames, type/function names, extension packages (@foxclaw/*), root package name (foxclaw)
- Legacy fallbacks added: .openclaw → .foxclaw (config paths), openclaw.plugin.json → foxclaw.plugin.json (manifests), openclaw.json → foxclaw.json (config file)
- README and docs/index.md rewritten for FoxClaw identity

### Still TODO
1. **packages/clawdbot and packages/moltbot** — legacy compat shims referencing `openclaw@workspace:*`. Delete or update.
2. **pnpm install + pnpm build** — cannot test on kite1 (live openclaw install). Must test on another cluster machine.
3. **Upstream import paths** — `from "openclaw/plugin-sdk/..."` still reference upstream npm package. Intentionally preserved until full decoupling.
4. **Slack extension** — still present, will be removed eventually per roadmap.
5. **Extension audit** — 20 extensions remain, need evaluation for relevance.
6. **10 test files with stale vi.mock() paths** — referencing deleted extensions, harmless but technically dead code.

### Remaining Extensions (20)
acpx, copilot-proxy, device-pair, diagnostics-otel, diffs, google-gemini-cli-auth, llm-task, lobster, memory-core, memory-lancedb, minimax-portal-auth, ollama, open-prose, qwen-portal-auth, sglang, shared, slack, test-utils, thread-ownership, vllm

### Remaining Skills (34)
1password, apple-notes, apple-reminders, blucli, blogwatcher, coding-agent, gemini, gh-issues, gifgrep, github, gog, goplaces, healthcheck, himalaya, mcporter, model-usage, nano-banana-pro, node-connect, notion, openai-image-gen, openai-whisper, openai-whisper-api, openhue, oracle, session-logs, sherpa-onnx-tts, skill-creator, slack, songsee, spotify-player, summarize, things-mac, tmux, video-frames

### Key Files
- Config path constant: `src/config/paths.ts` (NEW_STATE_DIRNAME = ".foxclaw")
- Plugin manifest constant: `src/plugins/manifest.ts` (PLUGIN_MANIFEST_FILENAME = "foxclaw.plugin.json")
- Legacy compat: `src/compat/legacy-names.ts`
- Root entry: `foxclaw.mjs`
