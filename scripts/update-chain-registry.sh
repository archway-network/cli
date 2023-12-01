#!/bin/bash
#
# Updates the local chain registry files.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"

curl -sfL \
  -o "${SCRIPT_DIR}"/../src/repositories/chain-registry/archway-1.json \
  'https://raw.githubusercontent.com/archway-network/networks/main/archway/chain.json'

curl -sfL \
  -o "${SCRIPT_DIR}"/../src/repositories/chain-registry/constantine-3.json \
  'https://raw.githubusercontent.com/archway-network/networks/main/testnets/archwaytestnet/chain.json'
