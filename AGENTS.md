# Repository Guidelines

- Repo: https://github.com/Foxlight-Foundation/foxclaw
- FoxClaw is a fork of OpenClaw, stripped to its core: CLI, gateway, agent runtime, plugin SDK, and Slack channel. Native apps (iOS/Android/macOS), Docker, and all channels except Slack have been removed.
- In chat replies, file references must be repo-root relative only (example: `extensions/slack/src/channel.ts:80`); never absolute paths or `~/...`.

## Project Structure

- Source code: `src/` (CLI wiring in `src/cli`, commands in `src/commands`, infra in `src/infra`, media pipeline in `src/media`).
- Tests: colocated `*.test.ts`.
- Docs: `docs/`. Built output lives in `dist/`.
- Plugins/extensions: `extensions/*` (workspace packages). Keep plugin-only deps in the extension `package.json`; do not add them to the root `package.json` unless core uses them.
- Plugins: install runs `npm install --omit=dev` in plugin dir; runtime deps must live in `dependencies`. Avoid `workspace:*` in `dependencies`; put `foxclaw` in `devDependencies` or `peerDependencies` instead (runtime resolves `foxclaw/plugin-sdk` via jiti alias).
- Current channel: **Slack only** (extension at `extensions/slack/`). The plugin system supports adding more channels as extensions.
- Skills: `skills/` (agent skill definitions).
- Key files:
  - Config path constant: `src/config/paths.ts` (state dir = `.foxclaw`)
  - Plugin manifest: `src/plugins/manifest.ts` (`foxclaw.plugin.json`)
  - Legacy compat: `src/compat/legacy-names.ts` (`.openclaw` -> `.foxclaw` fallbacks)
  - CLI entry: `foxclaw.mjs`

## Build, Test, and Development Commands

- Runtime baseline: Node **22+**.
- Install deps: `pnpm install`
- If deps are missing, run `pnpm install` then rerun the exact requested command once.
- Run CLI in dev: `pnpm foxclaw ...` or `pnpm dev`.
- Type-check/build: `pnpm build`
- TypeScript checks: `pnpm tsgo`
- Lint/format: `pnpm check`
- Format check: `pnpm format` (oxfmt --check)
- Format fix: `pnpm format:fix` (oxfmt --write)
- Tests: `pnpm test` (vitest); coverage: `pnpm test:coverage`
- For targeted tests: `pnpm test -- <path-or-filter> [vitest args...]`
- If local Vitest causes memory pressure: `FOXCLAW_TEST_PROFILE=low FOXCLAW_TEST_SERIAL_GATEWAY=1 pnpm test`

## Coding Style & Naming Conventions

- Language: TypeScript (ESM). Prefer strict typing; avoid `any`.
- Formatting/linting via Oxlint and Oxfmt; run `pnpm check` before commits.
- Never add `@ts-nocheck` and do not disable `no-explicit-any`; fix root causes.
- Dynamic import guardrail: do not mix `await import("x")` and static `import ... from "x"` for the same module in production code paths. Create a `*.runtime.ts` boundary for lazy loading.
- Never share class behavior via prototype mutation. Use explicit inheritance/composition.
- Add brief code comments for tricky or non-obvious logic.
- Keep files concise; aim for under ~500 LOC when feasible.
- Naming: use **FoxClaw** for product/app/docs headings; use `foxclaw` for CLI command, package/binary, paths, and config keys.
- Written English: use American spelling and grammar.

## Testing Guidelines

- Framework: Vitest with V8 coverage thresholds (70% lines/branches/functions/statements).
- Naming: match source names with `*.test.ts`; e2e in `*.e2e.test.ts`.
- Run `pnpm test` before pushing when you touch logic.
- Do not set test workers above 16.
- Changelog: user-facing changes only; no internal/meta notes.
- Pure test additions/fixes generally do **not** need a changelog entry.

## Commit Guidelines

- Follow concise, action-oriented commit messages (e.g., `CLI: add verbose flag to send`).
- Group related changes; avoid bundling unrelated refactors.
- Do not change version numbers without operator's explicit consent.

## Security & Configuration

- State lives under `~/.foxclaw/` by default.
- Config file: `~/.foxclaw/foxclaw.json`.
- Pi sessions live under `~/.foxclaw/sessions/`.
- Never commit or publish real phone numbers, videos, or live configuration values. Use fake placeholders.
- Troubleshooting: run `foxclaw doctor`.

## Docs (Mintlify)

- Docs are hosted on Mintlify (docs.foxclaw.ai).
- Internal doc links in `docs/**/*.md`: root-relative, no `.md`/`.mdx` (example: `[Config](/configuration)`).
- Section cross-references: use anchors on root-relative paths (example: `[Hooks](/configuration#hooks)`).
- Doc headings: avoid em dashes and apostrophes (break Mintlify anchor links).
- README (GitHub): keep absolute docs URLs (`https://docs.foxclaw.ai/...`).
- Docs content must be generic: no personal device names/hostnames/paths.

## Agent-Specific Notes

- Never edit `node_modules`.
- When working on a GitHub Issue or PR, print the full URL at the end of the task.
- When answering questions, respond with high-confidence answers only: verify in code; do not guess.
- Any dependency with `pnpm.patchedDependencies` must use an exact version (no `^`/`~`).
- Patching dependencies requires explicit approval; do not do this by default.
- CLI progress: use `src/cli/progress.ts` (`osc-progress` + `@clack/prompts` spinner); don't hand-roll spinners/bars.
- Status output: keep tables + ANSI-safe wrapping (`src/terminal/table.ts`).
- Lobster seam: use the shared CLI palette in `src/terminal/palette.ts` (no hardcoded colors).
- Tool schema guardrails: avoid `Type.Union` in tool input schemas; no `anyOf`/`oneOf`/`allOf`. Use `stringEnum`/`optionalStringEnum` for string lists. Avoid raw `format` property names.
- Bug investigations: read source code of relevant npm dependencies and all related local code before concluding; aim for high-confidence root cause.
- When asked to open a "session" file, open Pi session logs under `~/.foxclaw/agents/<agentId>/sessions/*.jsonl`.
- Never send streaming/partial replies to external messaging surfaces; only final replies.

## Multi-Agent Safety

- Do **not** create/apply/drop `git stash` entries unless explicitly requested.
- When the user says "push", you may `git pull --rebase` (never discard other agents' work). When the user says "commit", scope to your changes only.
- Do **not** create/remove/modify `git worktree` checkouts unless explicitly requested.
- Do **not** switch branches unless explicitly requested.
- When you see unrecognized files, keep going; focus on your changes and commit only those.
- Focus reports on your edits; avoid guard-rail disclaimers unless truly blocked.

## Lint/Format Churn

- If staged+unstaged diffs are formatting-only, auto-resolve without asking.
- If commit/push already requested, auto-stage formatting-only follow-ups in the same commit.
- Only ask when changes are semantic (logic/data/behavior).

## Version Location

- `package.json` (CLI version)
- `docs/install/updating.md` (pinned npm version)

## Upstream Compatibility

- Import paths like `from "openclaw/plugin-sdk/..."` reference the upstream npm package. These are intentionally preserved until full decoupling.
- Legacy config path fallbacks (`.openclaw` -> `.foxclaw`, `openclaw.json` -> `foxclaw.json`) are maintained in `src/compat/legacy-names.ts`.
