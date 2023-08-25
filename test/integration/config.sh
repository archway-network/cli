#!/bin/bash
#
# End to end tests of the archway-cli 'config' commands against a local node
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
output="$(archway-cli config init --chain $CHAIN_ID --json)"
validate "$output" ".chainId == \"$CHAIN_ID\" and .name == \"${PROJECT_NAME}\""
fileExists "${TEMP_DIR}/archway-cli.json" "Config file created" "Config file not found"

printf "\n***** config show ***** \n"
output="$(archway-cli config show --json)"
validate "$output" ".chainId == \"$CHAIN_ID\" and .name == \"${PROJECT_NAME}\""

printf "\n***** config deployments ***** \n"
output="$(archway-cli config deployments --json)"
validate "$output" ".deployments == []"

printf "\n***** config chains export ***** \n"
output="$(archway-cli config chains export archway-1 --json)"
validate "$output" '.chainId == "archway-1"'
fileExists "${TEMP_DIR}/.archway-cli/chains/archway-1.json" "Chain info exported" "Chain info not found"

printf "\n***** config chains import ***** \n"
output="$(archway-cli config chains import "$(scriptRelativePath files/test-1.json)" --json)"
validate "$output" '.chainId == "test-1"'

printf "\n***** config chains use ***** \n"
output="$(archway-cli config chains use test-1 --json)"
validate "$output" '.chainId == "test-1"'

echo
ok SUCCESS
echo "Cleaning up the created files"

cd ..
rm -rf "$TEMP_DIR"
