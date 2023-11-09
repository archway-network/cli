#!/bin/bash
#
# Starts a local node using Docker Compose and deploys the testing contracts.
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"

# shellcheck source=./_shared.sh
source "${SCRIPT_DIR}/_shared.sh"

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

topic "Starting the node"
docker compose up --remove-orphans -d

topic "Waiting for the node to generate the first block..."
if ! curl --retry 15 --retry-all-errors --retry-delay 2 -sfSL "http://$(docker compose port node 26657)/block?height=1" | jq -e '.error == null' >/dev/null; then
  docker compose logs node --tail 300
  error "node failed to start!"
fi
ok "node started"

topic "Preparing test wallets"
ALICE_MNEMONIC="culture ten bar chase cross obey margin owner recycle trim valid logic forward mixed render have patrol dynamic tuition choose thing salute inside blossom"
dotenv-add ALICE_MNEMONIC "${ALICE_MNEMONIC}"

declare -a alice_addresses=()
for i in {0..4}; do
  key_name="alice-$i"

  action "$key_name"
  if ! archwayd keys list --output json | jq --arg key_name "${key_name}" -e '.[] | select(.name == $key_name) | any' >/dev/null; then
    docker compose exec -e ALICE_MNEMONIC="${ALICE_MNEMONIC}" node \
      sh -c "echo \$ALICE_MNEMONIC | archwayd keys add --recover --index $i $key_name"
  fi

  address="$(archwayd keys show -a "${key_name}")"

  if archwayd q bank balances "${address}" | jq -e --argjson min_amount "5$(printf "%018d" 0)" '.balances[0].amount // "0" | tonumber < $min_amount' >/dev/null; then
    "${SCRIPT_DIR}"/faucet.sh "${address}"
  fi

  alice_addresses+=("${address}")
  ok "account created: ${address}"
done
