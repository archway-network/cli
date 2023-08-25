#!/bin/bash
#
# Starts a local node using Docker Compose and creates the testing accounts with funds.
#

set -euo pipefail

command -v jq >/dev/null 2>&1 || {
  echo >&2 "jq is required but not installed. Aborting."
  exit 1
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"

function ok() {
  echo " ✔ $1"
}

function error() {
  echo " 𝗑 Error: $1" >&2
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
  local error_message="${2:-}"
  if [[ -z "${tx_result}" ]] || ! jq -e '.code == 0' >/dev/null 2>&1 <<<"${tx_result}"; then
    [[ -n "${tx_result}" ]] && jq -r '.raw_log' <<<"${tx_result}" >&2
    error "${error_message}"
  fi
}

function dotenv-add() {
  local name="${1:-}"
  local value="\"${2:-}\""

  local dotenv="${SCRIPT_DIR}/../.env"

  [[ -f ${dotenv} ]] || touch "${dotenv}"

  if grep -qF -- "${name}=" "${dotenv}"; then
    replace="s/^${name}=.*/${name}=${value}/g"
    if [[ "$OSTYPE" =~ ^darwin ]]; then
      sed -i '' -e "${replace}" "${dotenv}"
    else
      sed -i -e "${replace}" "${dotenv}"
    fi
  else
    echo "${name}=${value}" >>"${dotenv}"
  fi
}

# shellcheck disable=SC2317
function cleanup() {
  if [[ ${CI:-} == true ]]; then
    echo "Shutting down..."
    docker compose down --volumes
  fi
}

trap cleanup ERR

echo "Starting the node..."
docker compose up --remove-orphans -d

echo
echo "Waiting for the node to generate the first block..."
if ! curl --retry 15 --retry-all-errors --retry-delay 2 -sfSL "http://$(docker compose port node 26657)/block?height=1" | jq -e '.error == null' >/dev/null; then
  docker compose logs node --tail 300
  error "node failed to start!"
fi
ok "node started"

echo
echo "Preparing test wallets..."
ALICE_MNEMONIC="car lobster husband business lens hospital income wisdom horror key spin zebra absorb brave bulb faint special control actress route powder exact during apology"
dotenv-add ALICE_MNEMONIC "${ALICE_MNEMONIC}"

declare -a alice_addresses=()
for i in {0..4}; do
  key_name="alice-$i"
  echo
  echo "[‣] $key_name"
  if ! archwayd keys list --output json | jq --arg key_name "${key_name}" -e '.[] | select(.name == $key_name) | any' >/dev/null; then
    docker compose exec -e ALICE_MNEMONIC="${ALICE_MNEMONIC}" node \
      sh -c "echo \$ALICE_MNEMONIC | archwayd keys add --recover --index $i $key_name"
  fi

  address="$(archwayd keys show -a "${key_name}")"

  if archwayd q bank balances "${address}" | jq -e --argjson min_amount "10$(printf "%018d" 0)" '.balances[0].amount // "0" | tonumber < $min_amount' >/dev/null; then
    "${SCRIPT_DIR}"/faucet.sh "${address}"
  fi

  alice_addresses+=("${address}")
  ok "account created: ${address}"
done
