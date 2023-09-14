#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(
  cd "$(dirname "$0")"
  pwd
)"

"${SCRIPT_DIR}"/config.sh
"${SCRIPT_DIR}"/accounts.sh
"${SCRIPT_DIR}"/contractsAndRewards.sh
