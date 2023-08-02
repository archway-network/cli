/* eslint-disable camelcase */
import ow from 'ow';

/**
 * Cosmos Chain.json is a metadata file that contains information about a cosmos sdk based chain.
 */
export interface CosmosChain {
  $schema?: string;
  chain_name: string;
  chain_id: string;
  pretty_name?: string;
  website?: string;
  update_link?: string;
  status?: 'live' | 'upcoming' | 'killed';
  network_type?: 'mainnet' | 'testnet' | 'devnet';
  /**
   * The default prefix for the human-readable part of addresses that identifies the coin type. Must be registered with SLIP-0173. E.g., 'cosmos'
   */
  bech32_prefix: string;
  /**
   * Used to override the bech32_prefix for specific uses.
   */
  bech32_config?: {
    /**
     * e.g., 'cosmos'
     */
    bech32PrefixAccAddr?: string;
    /**
     * e.g., 'cosmospub'
     */
    bech32PrefixAccPub?: string;
    /**
     * e.g., 'cosmosvaloper'
     */
    bech32PrefixValAddr?: string;
    /**
     * e.g., 'cosmosvaloperpub'
     */
    bech32PrefixValPub?: string;
    /**
     * e.g., 'cosmosvalcons'
     */
    bech32PrefixConsAddr?: string;
    /**
     * e.g., 'cosmosvalconspub'
     */
    bech32PrefixConsPub?: string;
    additionalProperties?: false;
    minProperties?: 1;
    [k: string]: unknown;
  };
  daemon_name?: string;
  node_home?: string;
  key_algos?: ('secp256k1' | 'ethsecp256k1' | 'ed25519' | 'sr25519')[];
  slip44?: number;
  alternative_slip44s?: number[];
  fees?: {
    fee_tokens: FeeToken[];
  };
  staking?: {
    staking_tokens: StakingToken[];
    lock_duration?: {
      /**
       * The number of blocks for which the staked tokens are locked.
       */
      blocks?: number;
      /**
       * The approximate time for which the staked tokens are locked.
       */
      time?: string;
    };
  };
  codebase?: {
    git_repo?: string;
    recommended_version?: string;
    compatible_versions?: string[];
    binaries?: {
      'linux/amd64'?: string;
      'linux/arm64'?: string;
      'darwin/amd64'?: string;
      'darwin/arm64'?: string;
      'windows/amd64'?: string;
    };
    genesis?: {
      name?: string;
      genesis_url: string;
    };
    cosmos_sdk_version?: string;
    tendermint_version?: string;
    cosmwasm_version?: string;
    cosmwasm_enabled?: boolean;
    ibc_go_version?: string;
    /**
     * List of IBC apps (usually corresponding to a ICS standard) which have been enabled on the network.
     */
    ics_enabled?: ('ics20-1' | 'ics27-1' | 'mauth')[];
    versions?: {
      /**
       * Official Upgrade Name
       */
      name: string;
      /**
       * Git Upgrade Tag
       */
      tag?: string;
      /**
       * Block Height
       */
      height?: number;
      /**
       * [Optional] Name of the following version
       */
      next_version_name?: string;
    }[];
  };
  images?: [
    {
      png?: string;
      svg?: string;
      theme?: {
        primary_color_hex?: string;
      };
    },
    ...{
      png?: string;
      svg?: string;
      theme?: {
        primary_color_hex?: string;
      };
    }[]
  ];
  logo_URIs?: {
    png?: string;
    svg?: string;
  };
  peers?: {
    seeds?: Peer[];
    persistent_peers?: Peer[];
  };
  apis?: {
    rpc?: Endpoint[];
    rest?: Endpoint[];
    grpc?: Endpoint[];
    wss?: Endpoint[];
    'grpc-web'?: Endpoint[];
    'evm-http-jsonrpc'?: Endpoint[];
  };
  explorers?: Explorer[];
  keywords?: string[];
  extra_codecs?: ('ethermint' | 'injective')[];
}

/**
 * Fee token information
 */
export interface FeeToken {
  denom: string;
  fixed_min_gas_price?: number;
  low_gas_price?: number;
  average_gas_price?: number;
  high_gas_price?: number;
  gas_costs?: {
    cosmos_send?: number;
    ibc_transfer?: number;
  };
}

/**
 * Staking token basic information
 */
export interface StakingToken {
  denom: string;
}

/**
 * Peer data information
 */
export interface Peer {
  id: string;
  address: string;
  provider?: string;
}

/**
 * Endpoint information
 */
export interface Endpoint {
  address: string;
  provider?: string;
  archive?: boolean;
}

/**
 * Block explorer information
 */
export interface Explorer {
  kind?: string;
  url?: string;
  tx_page?: string;
  account_page?: string;
}

/**
 * Format validator for the {@link FeeToken} interface
 */
export const feeTokenValidator = ow.object.exactShape({
  denom: ow.string,
  fixed_min_gas_price: ow.optional.number,
  low_gas_price: ow.optional.number,
  average_gas_price: ow.optional.number,
  high_gas_price: ow.optional.number,
  gas_costs: ow.optional.object.exactShape({
    cosmos_send: ow.optional.number,
    ibc_transfer: ow.optional.number,
  }),
});

/**
 * Format validator for the {@link StakingToken} interface
 */
export const stakingTokenValidator = ow.object.exactShape({
  denom: ow.string,
});

/**
 * Format validator for the {@link Peer} interface
 */
export const peerValidator = ow.object.exactShape({
  id: ow.string,
  address: ow.string,
  provider: ow.optional.string,
});

/**
 * Format validator for the {@link Endpoint} interface
 */
export const endpointValidator = ow.object.exactShape({
  address: ow.string,
  provider: ow.optional.string,
  archive: ow.optional.boolean,
});

/**
 * Format validator for the {@link Explorer} interface
 */
export const explorerValidator = ow.object.exactShape({
  kind: ow.optional.string,
  url: ow.optional.string,
  tx_page: ow.optional.string,
  account_page: ow.optional.string,
});

/**
 * Format validator for the {@link CosmosChain} interface
 */
export const cosmosChainValidator = ow.object.partialShape({
  chain_name: ow.string,
  chain_id: ow.string,
  pretty_name: ow.optional.string,
  website: ow.optional.string,
  update_link: ow.optional.string,
  status: ow.optional.string.oneOf(['live', 'upcoming', 'killed']),
  network_type: ow.optional.string.oneOf(['mainnet', 'testnet', 'devnet']),
  bech32_prefix: ow.string,
  becg32_config: ow.optional.object.partialShape({
    bech32PrefixAccAddr: ow.optional.string,
    bech32PrefixAccPub: ow.optional.string,
    bech32PrefixValAddr: ow.optional.string,
    bech32PrefixValPub: ow.optional.string,
    bech32PrefixConsAddr: ow.optional.string,
    bech32PrefixConsPub: ow.optional.string,
    additionalProperties: ow.optional.boolean,
  }),
  daemon_name: ow.optional.string,
  node_home: ow.optional.string,
  key_algos: ow.optional.array.ofType(ow.string.oneOf(['secp256k1', 'ethsecp256k1', 'ed25519', 'sr25519'])),
  slip44: ow.optional.number,
  alternative_slip44s: ow.optional.array.ofType(ow.number),
  fees: ow.optional.array.ofType(
    ow.object.exactShape({
      fee_tokens: ow.array.ofType(feeTokenValidator),
    })
  ),
  staking: ow.optional.object.exactShape({
    staking_tokens: ow.array.ofType(stakingTokenValidator),
    lock_duration: ow.optional.object.exactShape({
      blocks: ow.optional.number,
      time: ow.optional.string,
    }),
  }),
  codebase: ow.optional.object.exactShape({
    git_repo: ow.optional.string,
    recommended_version: ow.optional.string,
    compatible_versions: ow.optional.array.ofType(ow.string),
    binaries: ow.optional.object.exactShape({
      'linux/amd64': ow.optional.string,
      'linux/arm64': ow.optional.string,
      'darwin/amd64': ow.optional.string,
      'darwin/arm64': ow.optional.string,
      'windows/amd64': ow.optional.string,
    }),
    genesis: ow.optional.object.exactShape({
      name: ow.optional.string,
      genesis_url: ow.string,
    }),
    cosmos_sdk_version: ow.optional.string,
    tendermint_version: ow.optional.string,
    cosmwasm_version: ow.optional.string,
    cosmwasm_enabled: ow.optional.boolean,
    ibc_go_version: ow.optional.string,
    ics_enabled: ow.optional.array.ofType(ow.string.oneOf(['ics20-1', 'ics27-1', 'mauth'])),
    versions: ow.optional.array.ofType(
      ow.object.exactShape({
        name: ow.string,
        tag: ow.optional.string,
        height: ow.optional.number,
        next_version_name: ow.optional.string,
      })
    ),
  }),
  images: ow.optional.array.minLength(1).ofType(
    ow.object.exactShape({
      png: ow.optional.string,
      svg: ow.optional.string,
      theme: ow.optional.object.exactShape({
        primary_color_hex: ow.optional.string,
      }),
    })
  ),
  logo_URIs: ow.optional.object.exactShape({
    png: ow.optional.string,
    svg: ow.optional.string,
  }),
  peers: ow.optional.object.exactShape({
    seeds: ow.optional.array.ofType(peerValidator),
    persistent_peers: ow.optional.array.ofType(peerValidator),
  }),
  apis: ow.optional.object.partialShape({
    rpc: ow.optional.array.ofType(endpointValidator),
    rest: ow.optional.array.ofType(endpointValidator),
    grpc: ow.optional.array.ofType(endpointValidator),
    wss: ow.optional.array.ofType(endpointValidator),
    'grpc-web': ow.optional.array.ofType(endpointValidator),
    'evm-http-jsonrpc': ow.optional.array.ofType(endpointValidator),
  }),
  explorers: ow.optional.array.ofType(explorerValidator),
  keywords: ow.optional.array.ofType(ow.string),
  extra_codecs: ow.optional.array.ofType(ow.string.oneOf(['ethermint', 'injective'])),
});
