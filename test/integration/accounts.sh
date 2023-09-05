#!/bin/bash
#
# End to end tests of the archway 'accounts' commands against a local node
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
PROJECT_NAME="temp-accounts"
TEMP_DIR="$(pwd)/${PROJECT_NAME}"

source "${SCRIPT_DIR}/../../.env"
source "${SCRIPT_DIR}/utils.sh"

trap cleanup ERR

rm -rf "$TEMP_DIR"
git init "$TEMP_DIR"
cd "$PROJECT_NAME"

BOB=BOB_INTEGRATION_FILE_TEST

echo "***** remove integration test accounts in case they exist  *****"
output="$(archway accounts remove ${ALICE} --force --keyring-backend test --json || true)"
output="$(archway accounts remove ${BOB} --force --keyring-backend test --json || true)"

printf "\n***** accounts new ***** \n"
output="$(echo "$ALICE_MNEMONIC" | archway accounts new ${ALICE} --recover --keyring-backend test --json)"
validate "$output" ".name == \"${ALICE}\" and has(\"address\") and (.publicKey | has(\"key\")) and .mnemonic == \"${ALICE_MNEMONIC}\""

output="$(archway accounts new ${BOB} --keyring-backend test --json)"
validate "$output" ".name == \"${BOB}\" and has(\"address\") and (.publicKey | has(\"key\")) and .mnemonic != \"${ALICE_MNEMONIC}\""

printf "\n***** accounts list ***** \n"
output="$(archway accounts list --keyring-backend test --json)"
validate "$output" ".accounts | .[] | select(.name == \"${ALICE}\")"
validate "$output" ".accounts | .[] | select(.name == \"${BOB}\")"

printf "\n***** accounts get ***** \n"
output="$(archway accounts get ${ALICE} --keyring-backend test --json)"
validate "$output" ".name == \"${ALICE}\" and has(\"address\") and (.publicKey | has(\"key\"))"

printf "\n***** accounts remove ***** \n"
output="$(archway accounts remove ${BOB} --keyring-backend test --force --json)"
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
echo "Cleaning up the created files"

cd ..
rm -rf "$TEMP_DIR"
