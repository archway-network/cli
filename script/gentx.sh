#!/bin/bash

ACCOUNT=archway12nxly8ugzvzj20ekqg5n04s4emq392mpnxglay

archwayd gentx local-val 900000000000utorii \
    --commission-rate 0.1 \
    --commission-max-rate 0.1 \
    --commission-max-change-rate 0.1 \
    --pubkey $(archwayd tendermint show-validator) \
    --keyring-backend file \
    --chain-id archway-local \
    --moniker=archway
