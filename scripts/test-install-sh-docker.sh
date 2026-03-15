#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SMOKE_IMAGE="${FOXCLAW_INSTALL_SMOKE_IMAGE:-${CLAWDBOT_INSTALL_SMOKE_IMAGE:-foxclaw-install-smoke:local}}"
NONROOT_IMAGE="${FOXCLAW_INSTALL_NONROOT_IMAGE:-${CLAWDBOT_INSTALL_NONROOT_IMAGE:-foxclaw-install-nonroot:local}}"
INSTALL_URL="${FOXCLAW_INSTALL_URL:-${CLAWDBOT_INSTALL_URL:-https://foxclaw.bot/install.sh}}"
CLI_INSTALL_URL="${FOXCLAW_INSTALL_CLI_URL:-${CLAWDBOT_INSTALL_CLI_URL:-https://foxclaw.bot/install-cli.sh}}"
SKIP_NONROOT="${FOXCLAW_INSTALL_SMOKE_SKIP_NONROOT:-${CLAWDBOT_INSTALL_SMOKE_SKIP_NONROOT:-0}}"
SKIP_SMOKE_IMAGE_BUILD="${FOXCLAW_INSTALL_SMOKE_SKIP_IMAGE_BUILD:-${CLAWDBOT_INSTALL_SMOKE_SKIP_IMAGE_BUILD:-0}}"
SKIP_NONROOT_IMAGE_BUILD="${FOXCLAW_INSTALL_NONROOT_SKIP_IMAGE_BUILD:-${CLAWDBOT_INSTALL_NONROOT_SKIP_IMAGE_BUILD:-0}}"
LATEST_DIR="$(mktemp -d)"
LATEST_FILE="${LATEST_DIR}/latest"

if [[ "$SKIP_SMOKE_IMAGE_BUILD" == "1" ]]; then
  echo "==> Reuse prebuilt smoke image: $SMOKE_IMAGE"
else
  echo "==> Build smoke image (upgrade, root): $SMOKE_IMAGE"
  docker build \
    -t "$SMOKE_IMAGE" \
    -f "$ROOT_DIR/scripts/docker/install-sh-smoke/Dockerfile" \
    "$ROOT_DIR/scripts/docker"
fi

echo "==> Run installer smoke test (root): $INSTALL_URL"
docker run --rm -t \
  -v "${LATEST_DIR}:/out" \
  -e FOXCLAW_INSTALL_URL="$INSTALL_URL" \
  -e FOXCLAW_INSTALL_METHOD=npm \
  -e FOXCLAW_INSTALL_LATEST_OUT="/out/latest" \
  -e FOXCLAW_INSTALL_SMOKE_PREVIOUS="${FOXCLAW_INSTALL_SMOKE_PREVIOUS:-${CLAWDBOT_INSTALL_SMOKE_PREVIOUS:-}}" \
  -e FOXCLAW_INSTALL_SMOKE_SKIP_PREVIOUS="${FOXCLAW_INSTALL_SMOKE_SKIP_PREVIOUS:-${CLAWDBOT_INSTALL_SMOKE_SKIP_PREVIOUS:-0}}" \
  -e FOXCLAW_NO_ONBOARD=1 \
  -e DEBIAN_FRONTEND=noninteractive \
  "$SMOKE_IMAGE"

LATEST_VERSION=""
if [[ -f "$LATEST_FILE" ]]; then
  LATEST_VERSION="$(cat "$LATEST_FILE")"
fi

if [[ "$SKIP_NONROOT" == "1" ]]; then
  echo "==> Skip non-root installer smoke (FOXCLAW_INSTALL_SMOKE_SKIP_NONROOT=1)"
else
  if [[ "$SKIP_NONROOT_IMAGE_BUILD" == "1" ]]; then
    echo "==> Reuse prebuilt non-root image: $NONROOT_IMAGE"
  else
    echo "==> Build non-root image: $NONROOT_IMAGE"
    docker build \
      -t "$NONROOT_IMAGE" \
      -f "$ROOT_DIR/scripts/docker/install-sh-nonroot/Dockerfile" \
      "$ROOT_DIR/scripts/docker"
  fi

  echo "==> Run installer non-root test: $INSTALL_URL"
  docker run --rm -t \
    -e FOXCLAW_INSTALL_URL="$INSTALL_URL" \
    -e FOXCLAW_INSTALL_METHOD=npm \
    -e FOXCLAW_INSTALL_EXPECT_VERSION="$LATEST_VERSION" \
    -e FOXCLAW_NO_ONBOARD=1 \
    -e DEBIAN_FRONTEND=noninteractive \
    "$NONROOT_IMAGE"
fi

if [[ "${FOXCLAW_INSTALL_SMOKE_SKIP_CLI:-${CLAWDBOT_INSTALL_SMOKE_SKIP_CLI:-0}}" == "1" ]]; then
  echo "==> Skip CLI installer smoke (FOXCLAW_INSTALL_SMOKE_SKIP_CLI=1)"
  exit 0
fi

if [[ "$SKIP_NONROOT" == "1" ]]; then
  echo "==> Skip CLI installer smoke (non-root image skipped)"
  exit 0
fi

echo "==> Run CLI installer non-root test (same image)"
docker run --rm -t \
  --entrypoint /bin/bash \
  -e FOXCLAW_INSTALL_URL="$INSTALL_URL" \
  -e FOXCLAW_INSTALL_CLI_URL="$CLI_INSTALL_URL" \
  -e FOXCLAW_NO_ONBOARD=1 \
  -e DEBIAN_FRONTEND=noninteractive \
  "$NONROOT_IMAGE" -lc "curl -fsSL \"$CLI_INSTALL_URL\" | bash -s -- --set-npm-prefix --no-onboard"
