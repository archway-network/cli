/* eslint-disable camelcase */
import { ChainRegistry, GLOBAL_CHAINS_PATH } from '../../src/domain';
import { BuiltInChains } from '../../src/services';

export const chainFile = {
  $schema: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/chain.schema.json',
  chain_name: 'test',
  status: 'live',
  network_type: 'testnet',
  website: 'https://archway.io/',
  pretty_name: 'Test',
  chain_id: 'test-1',
  bech32_prefix: 'archway',
  daemon_name: 'archwayd',
  node_home: '$HOME/.archway',
  key_algos: ['secp256k1'],
  slip44: 118,
  fees: {
    fee_tokens: [
      {
        denom: 'aconst',
      },
    ],
  },
  staking: {
    staking_tokens: [
      {
        denom: 'aconst',
      },
    ],
  },
  codebase: {
    git_repo: 'https://github.com/archway-network/archway',
    recommended_version: 'v0.1.0',
    compatible_versions: ['v0.1.0'],
    binaries: {
      'linux/amd64': 'https://github.com/archway-network/archway/releases/download/v0.1.0/archway_0.1.0_linux_amd64.tar.gz',
    },
    cosmos_sdk_version: 'v0.45.11',
    tendermint_version: 'v0.34.23',
    cosmwasm_version: 'v0.29.2-archway',
    cosmwasm_enabled: true,
    ibc_go_version: 'v3.3.0',
    genesis: {
      genesis_url: 'https://raw.githubusercontent.com/archway-network/networks/main/constantine-3/genesis.json',
    },
    versions: [
      {
        name: 'v0.1.0',
        tag: 'v0.1.0',
        height: 0,
      },
    ],
  },
  peers: {
    seeds: [
      {
        id: '4f89952b73420ac7c7f7ab35ed5a2aee3a9e1dc0',
        address: '34.172.86.125:26656',
        provider: 'Archway Foundation',
      },
    ],
    persistent_peers: [
      {
        id: '8231851622f52005a4b0404fab666266a159afc4',
        address: '34.173.152.46:26656',
        provider: 'Archway Foundation',
      },
      {
        id: 'a2ad516c5301fb1a9793b0c9bd2195e16721ed73',
        address: '34.170.18.34:26656',
        provider: 'Archway Foundation',
      },
      {
        id: '802993601906fae95a19e96f2e8bd538b0d209d5',
        address: '35.222.155.3:26656',
        provider: 'Archway Foundation',
      },
    ],
  },
  apis: {
    rpc: [
      {
        address: 'https://rpc.constantine.archway.tech',
        provider: 'Archway Foundation',
      },
    ],
    rest: [
      {
        address: 'https://api.constantine.archway.tech',
        provider: 'Archway Foundation',
      },
    ],
    grpc: [
      {
        address: 'grpc.constantine.archway.tech:443',
        provider: 'Archway Foundation',
      },
    ],
  },
  explorers: [
    {
      kind: 'Constantine',
      url: 'https://explorer.constantine-3.archway.tech/',
      // eslint-disable-next-line no-template-curly-in-string
      tx_page: 'https://explorer.constantine-3.archway.tech/transactions/${txHash}',
      // eslint-disable-next-line no-template-curly-in-string
      account_page: 'https://explorer.constantine-3.archway.tech/account/${accountAddress}',
    },
  ],
};

export const chainString = JSON.stringify(chainFile);

export const chainNames = ['constantine-3', 'titus-1'];

export const chainRegistryInstance = new ChainRegistry([...Object.values({ ...BuiltInChains.chainMap })], GLOBAL_CHAINS_PATH, []);
