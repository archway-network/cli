#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"

function failed() {
  echo "$(tput setaf 1)❌ INTEGRATION TESTS FAILED" >&2
  exit 1
}

trap failed ERR

declare -a tests=("config" "accounts" "contractsAndRewards")

for test in "${tests[@]}"; do
  echo
  "${SCRIPT_DIR}"/"${test}".sh
done

echo " $(tput setaf 2)✅ INTEGRATION TESTS PASSED$(tput sgr0)"
