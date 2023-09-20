#!/bin/bash
#
# End to end tests of the archway 'contracts' commands against a local node
#

echo "››› CONTRACTS AND REWARDS"

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
PROJECT_NAME="test-contracts"
TEMP_DIR="$(mktemp -d -t "$PROJECT_NAME.XXXXXX")"

# moves the temp dir to ~/tmp to avoid permission issues on macOS
mkdir -p ~/.tmp
NEW_TEMP_DIR="$HOME/.tmp/$(basename "$TEMP_DIR")"
mv "$TEMP_DIR" "$NEW_TEMP_DIR"
TEMP_DIR="$NEW_TEMP_DIR"

PROJECT_DIR="$TEMP_DIR/$PROJECT_NAME"

cd "$TEMP_DIR"

source "${SCRIPT_DIR}/../../.env"
source "${SCRIPT_DIR}/utils.sh"

function cleanup_test_suite() {
  echo "Cleaning up the created files"
  cd "$SCRIPT_DIR"
  rm -rf "$TEMP_DIR"
}

trap cleanup_test_suite EXIT
trap cleanup ERR

CONTRACT_FOO=foo
CONTRACT_BAR=bar

echo "***** new *****"
export CARGO_GENERATE_VALUE_VERSION=full
output="$(archway new $PROJECT_NAME --chain constantine-3 --contract-name $CONTRACT_FOO --template increment --json)"
validate "$output" ".[\"chain-id\"] == \"constantine-3\""
fileExists "${PROJECT_DIR}/contracts/${CONTRACT_FOO}/src/contract.rs" "Contract template created" "Contract template not found"

cd "$PROJECT_DIR"
git init

useLocalChain

echo "***** contracts new *****"
output="$(archway contracts new $CONTRACT_BAR --template increment --json)"
validate "$output" ".template == \"increment\" and .name == \"${CONTRACT_BAR}\""
fileExists "${PROJECT_DIR}/contracts/${CONTRACT_BAR}/src/contract.rs" "Contract template created" "Contract template not found"
rm -rf "${PROJECT_DIR}/contracts/${CONTRACT_BAR}"

printf "\n***** contracts build ***** \n"
### Build the optimized version of the contract
output="$(archway contracts build $CONTRACT_FOO)"
regex "$output" "Optimized WASM binary saved"
regex "$output" "Schemas generated"

### Alternative optimized: This line copies a prebuilt and preoptimized wasm file, use when you don't want to test the "build --optimize" command which is slow
# cp -r "$(scriptRelativePath files/optimized/artifacts)" "$PROJECT_DIR"

# Needed on github workflow only (https://github.com/actions/runner/issues/434)
if [ -n "${CI:-}" ]; then
  sudo chmod 777 "${PROJECT_DIR}/artifacts" -R
fi

### Setup Alice account for transactions
createAlice
ALICE_ADDRESS=$(getAliceAddress)

printf "\n***** contracts store ***** \n"
output="$(archway contracts store $CONTRACT_FOO --from $ALICE --keyring-backend test --json)"
validate "$output" "has(\"codeId\") and has(\"transactionHash\")"
CODE_ID=$(jq -r ".codeId" <<<"${output}")
echo "Contract stored with codeId ${CODE_ID}"

printf "\n***** contracts instantiate ***** \n"
CONTRACT_AMOUNT=5
CONTRACT_DENOM=aarch
output="$(archway contracts instantiate $CONTRACT_FOO --args '{"count": 1}' --amount $CONTRACT_AMOUNT$CONTRACT_DENOM --from $ALICE --keyring-backend test --json)"
validate "$output" "has(\"contractAddress\") and has(\"transactionHash\")"
CONTRACT_ADDRESS=$(jq -r ".contractAddress" <<<"${output}")
echo "Contract instantiated into address ${CONTRACT_ADDRESS}"

printf "\n***** contracts migrate ***** \n"
### Copy optimized wasm file with the migratable new version of the contract, so we can store it and then migrate to it
cp -r "$(scriptRelativePath files/migrate/artifacts)" "$PROJECT_DIR"
output="$(archway contracts store $CONTRACT_FOO --from $ALICE --keyring-backend test --json)"
CODE_ID_MIGRATE=$(jq -r ".codeId" <<<"${output}")
echo "Stored new version of contract with codeId ${CODE_ID_MIGRATE}"
output="$(archway contracts migrate $CONTRACT_FOO --code $CODE_ID_MIGRATE --from $ALICE --keyring-backend test --json)"
validate "$output" "has(\"transactionHash\")"

printf "\n***** contracts metadata ***** \n"
output="$(archway contracts metadata $CONTRACT_FOO --owner-address $ALICE_ADDRESS --rewards-address $ALICE_ADDRESS --from $ALICE --keyring-backend test --json)"
validate "$output" ".metadata | .contractAddress == \"$CONTRACT_ADDRESS\" and .ownerAddress == \"$ALICE_ADDRESS\" and .rewardsAddress == \"$ALICE_ADDRESS\""

printf "\n***** contracts premium ***** \n"
PREMIUM_AMOUNT=1
PREMIUM_DENOM=aarch
output="$(archway contracts premium $CONTRACT_FOO --premium-fee $PREMIUM_AMOUNT$PREMIUM_DENOM --from $ALICE --keyring-backend test --json)"
validate "$output" ".premium | .contractAddress == \"$CONTRACT_ADDRESS\" and .flatFee.amount == \"$PREMIUM_AMOUNT\" and .flatFee.denom == \"$PREMIUM_DENOM\""

printf "\n***** contracts execute ***** \n"
output="$(archway contracts execute $CONTRACT_FOO --args '{"increment": {}}' --from $ALICE --keyring-backend test --gas-adjustment 1.5 --json)"
validate "$output" "has(\"transactionHash\")"

printf "\n***** contracts query smart ***** \n"
output="$(archway contracts query smart $CONTRACT_FOO --args '{"get_count": {}}' --json)"
validate "$output" ".count == 2"

printf "\n***** contracts query balance ***** \n"
output="$(archway contracts query balance $CONTRACT_FOO --json)"
validate "$output" ".contracts[] | select(.account.name == \"$CONTRACT_FOO\" and .account.address == \"$CONTRACT_ADDRESS\" and any(.account.balances[]; .denom == \"$CONTRACT_DENOM\" and  .amount == \"$CONTRACT_AMOUNT\" ))"

printf "\n***** rewards query ***** \n"
output="$(archway rewards query $ALICE --keyring-backend test --json)"
validate "$output" ".rewardsAddress == \"$ALICE_ADDRESS\" and .totalRecords > 0 and (.totalRewards | length) > 0"

printf "\n***** rewards withdraw ***** \n"
output="$(archway rewards withdraw --from $ALICE --keyring-backend test --json)"
validate "$output" ".rewardsAddress == \"$ALICE_ADDRESS\" and (.rewards[] | length) > 0"
output="$(archway rewards query $ALICE --keyring-backend test --json)"
validate "$output" ".rewardsAddress == \"$ALICE_ADDRESS\" and .totalRecords == 0 and (.totalRewards | length) == 0"

echo
ok SUCCESS
