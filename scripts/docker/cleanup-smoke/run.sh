#!/usr/bin/env bash
set -euo pipefail

cd /repo

export FOXCLAW_STATE_DIR="/tmp/foxclaw-test"
export FOXCLAW_CONFIG_PATH="${FOXCLAW_STATE_DIR}/foxclaw.json"

echo "==> Build"
pnpm build

echo "==> Seed state"
mkdir -p "${FOXCLAW_STATE_DIR}/credentials"
mkdir -p "${FOXCLAW_STATE_DIR}/agents/main/sessions"
echo '{}' >"${FOXCLAW_CONFIG_PATH}"
echo 'creds' >"${FOXCLAW_STATE_DIR}/credentials/marker.txt"
echo 'session' >"${FOXCLAW_STATE_DIR}/agents/main/sessions/sessions.json"

echo "==> Reset (config+creds+sessions)"
pnpm foxclaw reset --scope config+creds+sessions --yes --non-interactive

test ! -f "${FOXCLAW_CONFIG_PATH}"
test ! -d "${FOXCLAW_STATE_DIR}/credentials"
test ! -d "${FOXCLAW_STATE_DIR}/agents/main/sessions"

echo "==> Recreate minimal config"
mkdir -p "${FOXCLAW_STATE_DIR}/credentials"
echo '{}' >"${FOXCLAW_CONFIG_PATH}"

echo "==> Uninstall (state only)"
pnpm foxclaw uninstall --state --yes --non-interactive

test ! -d "${FOXCLAW_STATE_DIR}"

echo "OK"
