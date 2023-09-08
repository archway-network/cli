#!/bin/bash
#
# End to end tests of the archway 'config' commands against a local node
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
PROJECT_NAME="temp-config"
TEMP_DIR="$(pwd)/${PROJECT_NAME}"

source "${SCRIPT_DIR}/../../.env"
source "${SCRIPT_DIR}/utils.sh"

trap cleanup ERR

CHAIN_ID=constantine-3

rm -rf "$TEMP_DIR"
git init "$TEMP_DIR"
cd "$PROJECT_NAME"

echo "***** config init *****"
output="$(archway config init --chain $CHAIN_ID --json)"
validate "$output" ".[\"chain-id\"] == \"$CHAIN_ID\""
fileExists "${TEMP_DIR}/.archway/config.json" "Config file created" "Config file not found"

printf "\n***** config show ***** \n"
output="$(archway config show --json)"
validate "$output" ".[\"chain-id\"] == \"$CHAIN_ID\""

printf "\n***** config deployments ***** \n"
output="$(archway config deployments --json)"
validate "$output" ".deployments == []"

printf "\n***** config chains import ***** \n"
output="$(archway config chains import "$(scriptRelativePath files/integration-test-1.json)" --json)"
validate "$output" '.["chain-id"] == "integration-test-1"'

printf "\n***** config chains use ***** \n"
output="$(archway config chains use integration-test-1 --json)"
validate "$output" '.["chain-id"] == "integration-test-1"'

echo
ok SUCCESS
echo "Cleaning up the created files"

cd ..
rm -rf "$TEMP_DIR"
