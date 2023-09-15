#!/bin/bash
#
# End to end tests of the archway 'accounts' commands against a local node
#

echo "››› ACCOUNTS"

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
PROJECT_NAME="test-accounts"
TEMP_DIR="$(mktemp -d -t "$PROJECT_NAME.XXXXXX")"

source "${SCRIPT_DIR}/../../.env"
source "${SCRIPT_DIR}/utils.sh"

ALICE="${ALICE:-ALICE_INTEGRATION_FILE_TEST}"
BOB="BOB_INTEGRATION_FILE_TEST"

function cleanup_test_suite() {
  echo "Cleaning up the created files"
  cd "$SCRIPT_DIR"
  rm -rf "$TEMP_DIR"

  archway accounts remove "${BOB}" --force --keyring-backend test >/dev/null 2>&1 || true
}

trap cleanup_test_suite EXIT
trap cleanup ERR

git init "$TEMP_DIR"
cd "$TEMP_DIR"

echo "***** remove integration test accounts in case they exist  *****"
output="$(archway accounts remove "${ALICE}" --no-confirm --keyring-backend test --json || true)"
output="$(archway accounts remove "${BOB}" --no-confirm --keyring-backend test --json || true)"

printf "\n***** accounts new ***** \n"
output="$(echo "$ALICE_MNEMONIC" | archway accounts new "${ALICE}" --recover --keyring-backend test --json)"
validate "$output" '.name == "'"${ALICE}"'" and has("address") and (.publicKey | has("key")) and has("privateKey") and (has("mnemonic") | not)'

output="$(archway accounts new ${BOB} --keyring-backend test --json)"
validate "$output" '.name == "'"${BOB}"'" and has("address") and (.publicKey | has("key")) and has("privateKey") and has("mnemonic")'

printf "\n***** accounts list ***** \n"
output="$(archway accounts list --keyring-backend test --json)"
validate "$output" ".accounts | .[] | select(.name == \"${ALICE}\")"
validate "$output" ".accounts | .[] | select(.name == \"${BOB}\")"

printf "\n***** accounts get ***** \n"
output="$(archway accounts get ${ALICE} --keyring-backend test --json)"
validate "$output" ".name == \"${ALICE}\" and has(\"address\") and (.publicKey | has(\"key\"))"

printf "\n***** accounts remove ***** \n"
output="$(archway accounts remove ${BOB} --keyring-backend test --no-confirm --json)"
validate "$output" ".name == \"${BOB}\" and has(\"address\")"

output="$(archway accounts get ${BOB} --keyring-backend test --json || true)"
jq ".error.message | contains(\"not found\") " <<<"${output}"

printf "\n***** accounts balances get ***** \n"
initConfig
useLocalChain
output="$(archway accounts balances get $ALICE --keyring-backend test --json)"
validate "$output" ".account | .name == \"${ALICE}\" and has(\"address\") and (.balances | length) > 0"

output="$(archway accounts new ${BOB} --keyring-backend test --json)"
output="$(archway accounts balances get $BOB --keyring-backend test --json || true)"
validate "$output" ".account | .name == \"${BOB}\" and has(\"address\") and (.balances | length) == 0"

printf "\n***** accounts balances send ***** \n"
output="$(archway accounts balances send 1aarch --to $BOB --from $ALICE --no-confirm --keyring-backend test --json)"
validate "$output" "has(\"amount\") and .from.name == \"${ALICE}\" and .to.name == (\"${BOB}\")"

output="$(archway accounts balances get $BOB --keyring-backend test --json)"
validate "$output" ".account | .name == \"${BOB}\" and has(\"address\") and (.balances | length) > 0"

echo
ok SUCCESS
