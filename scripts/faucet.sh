#!/bin/bash
#
# Requests tokens from the local faucet.
#
# Usage: faucet.sh <address>

set -euo pipefail

ADDRESS="${1:-}"
if [[ -z "${ADDRESS}" ]]; then
  echo "Usage: faucet.sh <address>" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"

# shellcheck source=./_shared.sh
source "${SCRIPT_DIR}/_shared.sh"

amount="${2:-10}$(printf "%018d" 0)"
denom="$(archwayd q staking params | jq -r '.bond_denom')"

echo "Requesting ${amount}${denom} for ${ADDRESS}..."

archwayd-tx bank send "$(archwayd keys show validator -a)" "${ADDRESS}" "${amount}${denom}" > /dev/null

ok "Done!"
