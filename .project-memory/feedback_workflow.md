---
name: feedback-workflow
description: Workflow preferences for foxclaw development sessions
type: feedback
---

- Cannot run pnpm install or pnpm build on kite1 — live openclaw install would break. Use pnpm tsgo (typecheck only) for validation on that machine.
- Other cluster machines are fair game for full install/build/test.
- Incremental branch strategy: focused branch → typecheck → commit → ff-only merge → delete branch. Push to remote before risky work.
- Fat arrow functions always (CLAUDE.md convention).
- Never auto-commit — only commit when explicitly asked.
- Keep answers concise, don't over-explain.
