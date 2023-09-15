#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"

function failed() {
  echo "❌ INTEGRATION TESTS FAILED"
  exit 1
}

trap failed ERR

echo
"${SCRIPT_DIR}"/config.sh

echo
"${SCRIPT_DIR}"/accounts.sh

echo
"${SCRIPT_DIR}"/contractsAndRewards.sh

echo
echo "✅ INTEGRATION TESTS PASSED"
