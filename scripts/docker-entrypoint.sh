#!/bin/sh
#
# This script should be executed from the Docker container only.
# It will initialize the node if it's not configured yet.
#

set -eu

ARCHWAY_HOME="${ARCHWAY_HOME:-$HOME/.archway}"

CHAIN_ID="${CHAIN_ID:-local-1}"
DENOM="${DENOM:-aarch}"

MONIKER="${MONIKER:-docker-node}"
VALIDATOR_MNEMONIC="${VALIDATOR_MNEMONIC:-$(archwayd keys mnemonic)}"
GENESIS_ACCOUNTS="${GENESIS_ACCOUNTS:-}"

GENESIS_FILE="${ARCHWAY_HOME}/config/genesis.json"

# Defaults to 1b tokens
TOTAL_SUPPLY=${TOTAL_SUPPLY:-1000000000} #1b
ATTO_PAD="$(printf "%018d" 0)"
TOTAL_SUPPLY_AMOUNT="${TOTAL_SUPPLY}${ATTO_PAD}"

# shellcheck disable=SC2139
alias archwayd="archwayd --home ${ARCHWAY_HOME}"

has() {
  command -v "$1" >/dev/null 2>&1
}

if [ ! -f "${GENESIS_FILE}" ]; then
  # Check if required tools are installed
  if ! (has curl && has jq && has sponge); then
    apk add --no-cache ca-certificates curl jq moreutils
  fi
  if ! has dasel; then
    bin_url="$(curl -sSLf https://api.github.com/repos/tomwright/dasel/releases/latest | grep browser_download_url | grep linux_amd64 | grep -v .gz | cut -d\" -f 4)"
    curl -sSLf "${bin_url}" -L -o /usr/local/bin/dasel && chmod +x /usr/local/bin/dasel
  fi

  echo "Initializing the node ${MONIKER} on chain ${CHAIN_ID}..."
  archwayd init --chain-id "${CHAIN_ID}" "${MONIKER}" | jq .

  archwayd config chain-id "${CHAIN_ID}"
  archwayd config node "tcp://node:26657"
  archwayd config keyring-backend test
  archwayd config output json

  echo "Creating validator key..."
  echo "${VALIDATOR_MNEMONIC}" | archwayd keys add validator --recover

  set -x
  echo "Adding validator account with ${TOTAL_SUPPLY_AMOUNT}${DENOM}"
  archwayd genesis add-genesis-account validator "${TOTAL_SUPPLY_AMOUNT}${DENOM}"

  ACTUAL_SUPPLY_AMOUNT=$(jq -r '.app_state.bank.supply[0].amount' "${GENESIS_FILE}")
  [ "${ACTUAL_SUPPLY_AMOUNT}" = "${TOTAL_SUPPLY_AMOUNT}" ] || {
    echo "Genesis supply amount of ${ACTUAL_SUPPLY_AMOUNT}${DENOM} is not equal to ${TOTAL_SUPPLY_AMOUNT}${DENOM}"
    exit 1
  }

  echo "Defining genesis parameters..."
  DENOM_METADATA='[
		{
			"description": "The native staking token of the Archway blockchain.",
			"denom_units": [
				{
					"denom": "aarch",
					"exponent": 0,
					"aliases": []
				},
				{
					"denom": "uarch",
					"exponent": 12,
					"aliases": []
				},
				{
					"denom": "arch",
					"exponent": 18,
					"aliases": []
				}
			],
			"base": "aarch",
			"display": "arch",
			"name": "Archway Network Token",
			"symbol": "ARCH"
		}
	]'
  # shellcheck disable=SC2016
  GENESIS_PARAMS='
    .app_state.bank.denom_metadata = $denom_metadata |
    .app_state.crisis.constant_fee.denom = $denom |
    .app_state.distribution.params.community_tax = "0.060000000000000000" |
    .app_state.gov.deposit_params.min_deposit[0].denom = $denom |
    .app_state.gov.deposit_params.min_deposit[0].amount = "10000000000000000" |
    .app_state.gov.deposit_params.max_deposit_period = "10s" |
    .app_state.gov.voting_params.voting_period = "2h" |
    .app_state.mint.params.mint_denom = $denom |
    .app_state.mint.params.inflation_max = "0.1" |
    .app_state.mint.params.inflation_min = "0.0999999999" |
    .app_state.mint.params.blocks_per_year = "5259600" |
    .app_state.rewards.min_consensus_fee.denom = $denom |
    .app_state.rewards.params.min_price_of_gas.amount = "900000000000" |
    .app_state.rewards.params.min_price_of_gas.denom = $denom |
    .app_state.staking.params.bond_denom = $denom |
    .consensus_params.block.max_gas = "300000000"
  '
  jq --arg denom "${DENOM}" --argjson denom_metadata "${DENOM_METADATA}" "${GENESIS_PARAMS}" "${GENESIS_FILE}" |
    sponge "${GENESIS_FILE}"

  DELEGATION_AMOUNT="$((TOTAL_SUPPLY / 2))${ATTO_PAD}"
  echo "Generating the genesis tx with delegation of ${DELEGATION_AMOUNT}${DENOM}..."
  archwayd genesis gentx validator "${DELEGATION_AMOUNT}${DENOM}" --chain-id "${CHAIN_ID}" --fees 180000000000000000aarch

  archwayd genesis collect-gentxs
  archwayd genesis validate-genesis

  dasel put -r toml -t string -v "900000000000${DENOM}" 'minimum-gas-prices' <"${ARCHWAY_HOME}/config/app.toml" |
    dasel put -r toml -t bool -v true 'api.enable' |
    dasel put -r toml -t bool -v true 'grpc-web.enable-unsafe-cors' |
    sponge "${ARCHWAY_HOME}/config/app.toml"

  dasel put -r toml -t string -v 'tcp://0.0.0.0:26658' 'proxy_app' <"${ARCHWAY_HOME}/config/config.toml" |
    dasel put -r toml -t string -v 'tcp://0.0.0.0:26657' 'rpc.laddr' |
    dasel put -r toml -t string -v '*' 'rpc.cors_allowed_origins.[]' |
    dasel put -r toml -t bool -v true 'rpc.unsafe' |
    sponge "${ARCHWAY_HOME}/config/config.toml"
fi

archwayd "$@"
