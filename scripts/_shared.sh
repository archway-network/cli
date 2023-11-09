#!/bin/bash

set -euo pipefail

function require() {
  if ! command -v "${1}" >/dev/null 2>&1; then
    echo "Command '${1}' is required but not installed. Aborting." >&2
    exit 1
  fi
}

require jq
require docker

function ok() {
  echo " $(tput setaf 2)✔$(tput sgr0) ${1}"
}

function error() {
  echo " $(tput setaf 1)𝗑 Error:$(tput sgr0) ${1}" >&2
  exit 1
}

function topic() {
  echo
  echo "$(tput bold)$(tput setaf 4)${1}$(tput sgr0)"
}

function action() {
  echo
  echo "$(tput setaf 7)[$(tput setaf 6)‣$(tput setaf 7)] $(tput setaf 6)${1}$(tput sgr0)"
}

function step() {
  echo " $(tput setaf 5)• ${1}$(tput sgr0)"
}

function archwayd() {
  docker compose exec node archwayd "$@"
}

function gas-prices-estimate() {
  archwayd q rewards estimate-fees 1 --output json |
    jq -r '.gas_unit_price | (.amount + .denom)'
}

function archwayd-tx() {
  declare -a args=()
  declare gas="auto"
  declare gas_prices
  gas_prices="--gas-prices $(gas-prices-estimate)"

  set -- "$@" "${EOL:=$(printf '\1\3\3\7')}"  # end-of-list marker
  while [ "$1" != "$EOL" ]; do
    opt="$1"; shift

    if [[ "$opt" == "--gas" ]]; then
      gas="$1"; shift
      gas_prices=""
      continue
    fi

    args+=("$opt")
  done


  tx_result="$(
    # shellcheck disable=SC2086
    archwayd tx "${args[@]}" \
      --gas "${gas}" ${gas_prices} \
      --gas-adjustment 1.5 \
      --broadcast-mode sync \
      --output json \
      --yes
  )"
  validate-tx "${tx_result}"

  declare timeout=8
  declare counter=0

  tx_hash="$(jq -r '.txhash' <<<"${tx_result}")"

  while jq -e '.height == "0"' >/dev/null 2>&1 <<<"${tx_result}"; do
    counter=$((counter + 1))
    if [[ "${counter}" -gt "${timeout}" ]]; then
      echo "Transaction ${tx_hash} was not included in a block within ${timeout} seconds. Aborting." >&2
      exit 1
    fi

    sleep 1

    tx_result="$(archwayd q tx "${tx_hash}" --output json 2>/dev/null || echo '{ "height": "0" }')"
  done

  validate-tx "${tx_result}"

  echo "${tx_result}"
}

function validate-tx() {
  local tx_result="${1:-}"
  if [[ -z "${tx_result}" ]] || ! jq -e '.code == 0' >/dev/null 2>&1 <<<"${tx_result}"; then
    [[ -n "${tx_result}" ]] && echo "" && jq -r '.raw_log' <<<"${tx_result}" >&2
    exit 1
  fi
}
