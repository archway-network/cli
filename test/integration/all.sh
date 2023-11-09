#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"

function failed() {
  error "INTEGRATION TESTS FAILED"
}

trap failed ERR

declare -a tests=("config" "accounts" "contractsAndRewards")

for test in "${tests[@]}"; do
  echo
  "${SCRIPT_DIR}"/"${test}".sh
done

ok "INTEGRATION TESTS PASSED"
