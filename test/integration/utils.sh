#!/bin/bash
#
# Functions that are used in the end-to-end tests
#

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
ALICE=ALICE_INTEGRATION_FILE_TEST
export ARCHWAY_SKIP_VERSION_CHECK=true

function ok() {
  echo " ✔ $1"
}

function error() {
  echo " 𝗑 Error: $1" >&2
  exit 1
}

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
    echo "$result"
    error "${4:-}"
  elif [[ -n "${2-}" ]] && ! jq -e "${2}" >/dev/null 2>&1 <<<"${result}"; then
    error "${4:-"Invalid JSON output"}"
  else
    ok "${3:-"Valid JSON output"}"
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
  "$(scriptRelativePath ../../bin/run)" "$@"
}

function initConfig() {
  echo "Creating a config file"
  archway config init --chain constantine-3 --json
}

function useLocalChain() {
  echo "Setting local chain config"
  archway config chains import "$(scriptRelativePath files/integration-test-1.json)" --json
  archway config chains use integration-test-1
}

function createAlice() {
  echo "Recreating Alice Account"
  archway accounts remove ${ALICE} --force --keyring-backend test --json || true
  echo "$ALICE_MNEMONIC" | archway accounts new ${ALICE} --recover --keyring-backend test --json
}

function getAliceAddress() {
  archway accounts get ${ALICE} --keyring-backend test --address
}

# shellcheck disable=SC2317
function cleanup() {
  printf "\n ! Unexpected error"
  if [[ ${CI:-} == true ]]; then
    echo "Shutting down..."
    docker compose down --volumes
  fi
}