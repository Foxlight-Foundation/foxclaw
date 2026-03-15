---
summary: "Uninstall FoxClaw completely (CLI, service, state, workspace)"
read_when:
  - You want to remove FoxClaw from a machine
  - The gateway service is still running after uninstall
title: "Uninstall"
---

# Uninstall

Two paths:

- **Easy path** if `foxclaw` is still installed.
- **Manual service removal** if the CLI is gone but the service is still running.

## Easy path (CLI still installed)

Recommended: use the built-in uninstaller:

```bash
foxclaw uninstall
```

Non-interactive (automation / npx):

```bash
foxclaw uninstall --all --yes --non-interactive
npx -y foxclaw uninstall --all --yes --non-interactive
```

Manual steps (same result):

1. Stop the gateway service:

```bash
foxclaw gateway stop
```

2. Uninstall the gateway service (launchd/systemd/schtasks):

```bash
foxclaw gateway uninstall
```

3. Delete state + config:

```bash
rm -rf "${FOXCLAW_STATE_DIR:-$HOME/.foxclaw}"
```

If you set `FOXCLAW_CONFIG_PATH` to a custom location outside the state dir, delete that file too.

4. Delete your workspace (optional, removes agent files):

```bash
rm -rf ~/.foxclaw/workspace
```

5. Remove the CLI install (pick the one you used):

```bash
npm rm -g foxclaw
pnpm remove -g foxclaw
bun remove -g foxclaw
```

6. If you installed the macOS app:

```bash
rm -rf /Applications/FoxClaw.app
```

Notes:

- If you used profiles (`--profile` / `FOXCLAW_PROFILE`), repeat step 3 for each state dir (defaults are `~/.foxclaw-<profile>`).
- In remote mode, the state dir lives on the **gateway host**, so run steps 1-4 there too.

## Manual service removal (CLI not installed)

Use this if the gateway service keeps running but `foxclaw` is missing.

### macOS (launchd)

Default label is `ai.foxclaw.gateway` (or `ai.foxclaw.<profile>`; legacy `com.foxclaw.*` may still exist):

```bash
launchctl bootout gui/$UID/ai.foxclaw.gateway
rm -f ~/Library/LaunchAgents/ai.foxclaw.gateway.plist
```

If you used a profile, replace the label and plist name with `ai.foxclaw.<profile>`. Remove any legacy `com.foxclaw.*` plists if present.

### Linux (systemd user unit)

Default unit name is `foxclaw-gateway.service` (or `foxclaw-gateway-<profile>.service`):

```bash
systemctl --user disable --now foxclaw-gateway.service
rm -f ~/.config/systemd/user/foxclaw-gateway.service
systemctl --user daemon-reload
```

### Windows (Scheduled Task)

Default task name is `FoxClaw Gateway` (or `FoxClaw Gateway (<profile>)`).
The task script lives under your state dir.

```powershell
schtasks /Delete /F /TN "FoxClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.foxclaw\gateway.cmd"
```

If you used a profile, delete the matching task name and `~\.foxclaw-<profile>\gateway.cmd`.

## Normal install vs source checkout

### Normal install (install.sh / npm / pnpm / bun)

If you used `https://foxclaw.ai/install.sh` or `install.ps1`, the CLI was installed with `npm install -g foxclaw@latest`.
Remove it with `npm rm -g foxclaw` (or `pnpm remove -g` / `bun remove -g` if you installed that way).

### Source checkout (git clone)

If you run from a repo checkout (`git clone` + `foxclaw ...` / `bun run foxclaw ...`):

1. Uninstall the gateway service **before** deleting the repo (use the easy path above or manual service removal).
2. Delete the repo directory.
3. Remove state + workspace as shown above.
