#!/bin/bash
#
# Functions that are used in the end-to-end tests
#

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"

ALICE=ALICE_INTEGRATION_FILE_TEST
export ARCHWAY_SKIP_VERSION_CHECK=true

source "${SCRIPT_DIR}/../../scripts/_shared.sh"

function scriptRelativePath() {
  echo "${SCRIPT_DIR}/${1}"
}

function fileExists() {
  if [ -f "$1" ]; then
    ok "${2:-"File exists"}"
  else
    error "${3:-"File doesn\'t exist"}"
  fi
}

function validate() {
  local result="${1:-}"
  if [[ -z "${result}" ]] || jq -e 'has("error")' >/dev/null 2>&1 <<<"${result}"; then
    echo "$result" | jq
    error "$(echo "$result" | jq -r '.error?.message? // "Unknown error"')"
  elif [[ -n "${2-}" ]] && ! jq -e "${2}" >/dev/null 2>&1 <<<"${result}"; then
    error "Invalid JSON output"
  else
    ok "Valid JSON output"
  fi
}

function regex() {
  if [[ "${1:-}" =~ .*"${2:-}".* ]]; then
    ok "${3:-"String contains the expected data"}"
  else
    error "${4:-"String doesn't contain the expected data"}"
  fi
}

function archway() {
  set +e
  "$(scriptRelativePath ../../bin/run)" "$@"
  set -e
}

function initConfig() {
  step "Creating a config file"
  archway config init --chain constantine-3 --json >/dev/null 2>&1
}

function useLocalChain() {
  step "Setting local chain config"
  archway config chains import "$(scriptRelativePath ../fixtures/local-1.json)" --json >/dev/null 2>&1
  archway config chains use local-1
}

function createAlice() {
  step "Recreating Alice Account"
  archway accounts remove ${ALICE} --no-confirm --keyring-backend test >/dev/null 2>&1 || true
  echo "$ALICE_MNEMONIC" | archway accounts new ${ALICE} --recover --keyring-backend test --json
  "$(scriptRelativePath ../../scripts/faucet.sh)" "$(getAliceAddress)"
}

function getAliceAddress() {
  archway accounts get ${ALICE} --keyring-backend test --address
}

# shellcheck disable=SC2317
function cleanup() {
  error "Unexpected error"

  # remove alice's account
  archway accounts remove "${ALICE}" --force --keyring-backend test >/dev/null 2>&1 || true

  if [[ ${CI:-} == true ]]; then
    echo "Shutting down..."
    docker compose down --volumes
  fi
}
