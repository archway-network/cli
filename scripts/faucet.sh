#!/bin/bash
#
# Requests tokens from the local faucet.
#
# Usage: faucet.sh <address>

set -euo pipefail

command -v jq >/dev/null 2>&1 || {
  echo >&2 "jq is required but not installed. Aborting."
  exit 1
}

command -v curl >/dev/null 2>&1 || {
  echo >&2 "curl is required but not installed. Aborting."
  exit 1
}

function archwayd() {
  docker compose exec node archwayd "$@"
}

function gas-prices-estimate() {
  archwayd q rewards estimate-fees 1 --output json |
    jq -r '.gas_unit_price | (.amount + .denom)'
}

function archwayd-tx() {
  archwayd tx "$@" \
    --gas auto \
    --gas-prices "$(gas-prices-estimate)" \
    --gas-adjustment 1.3 \
    --broadcast-mode block \
    --output json \
    --yes
}

function validate-tx() {
  local tx_result="${1:-}"
  if [[ -z "${tx_result}" ]] || ! jq -e '.code == 0' >/dev/null 2>&1 <<<"${tx_result}"; then
    [[ -n "${tx_result}" ]] && jq -r '.raw_log' <<<"${tx_result}" >&2
    exit 1
  fi
}

ADDRESS="${1:-}"
if [[ -z "${ADDRESS}" ]]; then
  echo "Usage: faucet.sh <address>" >&2
  exit 1
fi

amount="${2:-100}$(printf "%018d" 0)"
denom="$(archwayd q staking params | jq -r '.bond_denom')"

echo "Requesting ${amount}${denom} for ${ADDRESS}..."

tx_result="$(archwayd-tx bank send "$(archwayd keys show validator -a)" "${ADDRESS}" "${amount}${denom}")"
validate-tx "${tx_result}"

echo "Done!"
