#!/usr/bin/env bash
#
# build-lambda.sh — Build the four Lambda deployment bundles from backend/.
#
# Taskly runs four Lambda functions from a single backend codebase:
#   - api-handler            (handler = index.handler; index.mjs re-exports lambda/handler.js)
#   - achievement-processor  (handler = lambda/processors/achievement-processor.handler)
#   - notification-processor (handler = lambda/processors/notification-processor.handler)
#   - email-processor        (handler = lambda/processors/email-processor.handler)
#
# All four handlers import shared backend code (../server.js, ../utils/secrets.js, etc.)
# and depend on node_modules (@vendia/serverless-express, mongoose, aws-sdk, ...).
# The simplest correct approach — and the one used here — is to make ALL FOUR zips
# an IDENTICAL bundle containing the full backend contents. Every handler path then
# resolves regardless of which zip a given Lambda loads. Files are placed at the
# ARCHIVE ROOT (we zip from INSIDE backend/, never from the parent directory) so that
# handler paths like "index.handler" and "lambda/processors/email-processor.handler"
# resolve correctly.
#
# The script is idempotent: it cleans/recreates the output dir each run and rebuilds
# production dependencies. Output directory defaults to backend/build and can be
# overridden with the first positional arg or the BUILD_DIR env var.
#
# Usage:
#   bash scripts/build-lambda.sh [output_dir]
#
set -euo pipefail

# --- Resolve paths -----------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
BACKEND_DIR="${REPO_ROOT}/backend"
BUILD_DIR="${1:-${BUILD_DIR:-${BACKEND_DIR}/build}}"

PEM_URL="https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem"
PEM_PATH="${BACKEND_DIR}/global-bundle.pem"

echo "==> Repo root:   ${REPO_ROOT}"
echo "==> Backend dir: ${BACKEND_DIR}"
echo "==> Build dir:   ${BUILD_DIR}"

# --- Activate Node 20 via nvm (best effort) ----------------------------------
if [ -s "${HOME}/.nvm/nvm.sh" ]; then
  # shellcheck disable=SC1091
  source "${HOME}/.nvm/nvm.sh"
  nvm use 20 >/dev/null 2>&1 || echo "WARN: 'nvm use 20' failed; using current node ($(node -v 2>/dev/null || echo 'none'))"
else
  echo "WARN: ~/.nvm/nvm.sh not found; using current node ($(node -v 2>/dev/null || echo 'none'))"
fi

# --- Install production dependencies only ------------------------------------
cd "${BACKEND_DIR}"
echo "==> Installing production dependencies (npm install --omit=dev)"
npm install --omit=dev

# --- Prune bundle bloat to stay under Lambda's 250MB unzipped limit ----------
# The full production node_modules is ~310MB unzipped, which exceeds Lambda's
# hard limit of 262144000 bytes (250 MiB). We prune packages that are either
# provided by the Node.js 20 Lambda runtime or unused by the four deployed
# handlers:
#   - @aws-sdk / @smithy : AWS SDK for JavaScript v3 is bundled in the nodejs20.x
#                          runtime (client-s3, client-ses, client-sqs,
#                          client-eventbridge, client-secrets-manager,
#                          s3-request-presigner, ...). Safe to exclude from the zip.
#   - @img / sharp       : native image libs imported ONLY by
#                          lambda/processors/image-processor.js, which is NOT one
#                          of the four deployed functions. Not loaded by the
#                          api/achievement/notification/email handlers.
#   - core-js            : polyfill with no direct import in backend source.
# This reduces the unzipped bundle to ~238MB.
PRUNE_MODULES=(
  "@aws-sdk"
  "@smithy"
  "@img"
  "sharp"
  "core-js"
)
echo "==> Pruning runtime-provided / unused modules to fit the 250MB limit"
for m in "${PRUNE_MODULES[@]}"; do
  if [ -e "${BACKEND_DIR}/node_modules/${m}" ]; then
    echo "    - removing node_modules/${m}"
    rm -rf "${BACKEND_DIR}/node_modules/${m:?}"
  fi
done

# --- Download the DocumentDB TLS certificate bundle --------------------------
echo "==> Downloading DocumentDB global TLS bundle -> ${PEM_PATH}"
curl -fsSL "${PEM_URL}" -o "${PEM_PATH}"

# --- Prepare a clean output directory ----------------------------------------
rm -rf "${BUILD_DIR}"
mkdir -p "${BUILD_DIR}"

# --- Build the canonical bundle ----------------------------------------------
# Files/dirs included at the ARCHIVE ROOT. We zip from inside backend/ so paths
# like "index.mjs" and "lambda/handler.js" sit at the top of the archive.
API_ZIP="${BUILD_DIR}/api-handler.zip"

ROOT_FILES=(
  index.mjs
  server.js
  package.json
  schemas.js
  global-bundle.pem
)

ROOT_DIRS=(
  lambda
  config
  controllers
  middleware
  models
  routes
  services
  utils
  node_modules
)

# Collect only the entries that actually exist so the script stays robust.
INCLUDE=()
for f in "${ROOT_FILES[@]}"; do
  [ -e "${BACKEND_DIR}/${f}" ] && INCLUDE+=("${f}") || echo "WARN: missing file ${f}, skipping"
done
for d in "${ROOT_DIRS[@]}"; do
  [ -d "${BACKEND_DIR}/${d}" ] && INCLUDE+=("${d}") || echo "WARN: missing dir ${d}, skipping"
done

echo "==> Creating ${API_ZIP} (full backend bundle at archive root)"
( cd "${BACKEND_DIR}" && zip -r -q "${API_ZIP}" "${INCLUDE[@]}" )

# --- The processor bundles are identical copies of the api bundle ------------
for name in achievement-processor notification-processor email-processor; do
  echo "==> Creating ${BUILD_DIR}/${name}.zip (copy of api bundle)"
  cp "${API_ZIP}" "${BUILD_DIR}/${name}.zip"
done

# --- Summary -----------------------------------------------------------------
echo ""
echo "==> Build complete. Artifacts:"
ls -lh "${BUILD_DIR}"/*.zip
echo ""
echo "==> api-handler.zip key entries:"
unzip -l "${API_ZIP}" | grep -E 'index.mjs|lambda/handler.js|lambda/processors|node_modules/@vendia/serverless-express' | head -n 10 || true
