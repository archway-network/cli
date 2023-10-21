/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable camelcase */
import ow from 'ow';

/**
 * Cosmos Chain contains meatadata information about a cosmos sdk based chain.
 */
export interface CosmosChain {
  $schema?: string;
  alternative_slip44s?: number[];
  apis?: {
    'evm-http-jsonrpc'?: Endpoint[];
    grpc?: Endpoint[];
    'grpc-web'?: Endpoint[];
    rest?: Endpoint[];
    rpc?: Endpoint[];
    wss?: Endpoint[];
  };
  /**
   * Used to override the bech32_prefix for specific uses.
   */
  bech32_config?: {
    [k: string]: unknown;
    additionalProperties?: false;
    /**
     * e.g., 'cosmos'
     */
    bech32PrefixAccAddr?: string;
    /**
     * e.g., 'cosmospub'
     */
    bech32PrefixAccPub?: string;
    /**
     * e.g., 'cosmosvalcons'
     */
    bech32PrefixConsAddr?: string;
    /**
     * e.g., 'cosmosvalconspub'
     */
    bech32PrefixConsPub?: string;
    /**
     * e.g., 'cosmosvaloper'
     */
    bech32PrefixValAddr?: string;
    /**
     * e.g., 'cosmosvaloperpub'
     */
    bech32PrefixValPub?: string;
    minProperties?: 1;
  };
  /**
   * The default prefix for the human-readable part of addresses that identifies the coin type. Must be registered with SLIP-0173. E.g., 'cosmos'
   */
  bech32_prefix: string;
  chain_id: string;
  chain_name: string;
  codebase?: {
    binaries?: {
      'darwin/amd64'?: string;
      'darwin/arm64'?: string;
      'linux/amd64'?: string;
      'linux/arm64'?: string;
      'windows/amd64'?: string;
    };
    compatible_versions?: string[];
    cosmos_sdk_version?: string;
    cosmwasm_enabled?: boolean;
    cosmwasm_version?: string;
    genesis?: {
      genesis_url: string;
      name?: string;
    };
    git_repo?: string;
    ibc_go_version?: string;
    /**
     * List of IBC apps (usually corresponding to a ICS standard) which have been enabled on the network.
     */
    ics_enabled?: Array<'ics20-1' | 'ics27-1' | 'mauth'>;
    recommended_version?: string;
    tendermint_version?: string;
    versions?: Array<{
      /**
       * Block Height
       */
      height?: number;
      /**
       * Official Upgrade Name
       */
      name: string;
      /**
       * [Optional] Name of the following version
       */
      next_version_name?: string;
      /**
       * Git Upgrade Tag
       */
      tag?: string;
    }>;
  };
  daemon_name?: string;
  explorers?: Explorer[];
  extra_codecs?: Array<'ethermint' | 'injective'>;
  fees?: {
    fee_tokens: FeeToken[];
  };
  images?: [
    {
      png?: string;
      svg?: string;
      theme?: {
        primary_color_hex?: string;
      };
    },
    ...Array<{
      png?: string;
      svg?: string;
      theme?: {
        primary_color_hex?: string;
      };
    }>
  ];
  key_algos?: Array<'ed25519' | 'ethsecp256k1' | 'secp256k1' | 'sr25519'>;
  keywords?: string[];
  logo_URIs?: {
    png?: string;
    svg?: string;
  };
  network_type?: 'devnet' | 'mainnet' | 'testnet';
  node_home?: string;
  peers?: {
    persistent_peers?: Peer[];
    seeds?: Peer[];
  };
  pretty_name?: string;
  slip44?: number;
  staking?: {
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
    staking_tokens: StakingToken[];
  };
  status?: 'killed' | 'live' | 'upcoming';
  update_link?: string;
  website?: string;
}

/**
 * Fee token information
 */
export interface FeeToken {
  average_gas_price?: number;
  denom: string;
  fixed_min_gas_price?: number;
  gas_costs?: {
    cosmos_send?: number;
    ibc_transfer?: number;
  };
  high_gas_price?: number;
  low_gas_price?: number;
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
  address: string;
  id: string;
  provider?: string;
}

/**
 * Endpoint information
 */
export interface Endpoint {
  address: string;
  archive?: boolean;
  provider?: string;
}

/**
 * Block explorer information
 */
export interface Explorer {
  account_page?: string;
  kind?: string;
  tx_page?: string;
  url?: string;
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
  fees: ow.optional.object.exactShape({
    fee_tokens: ow.array.ofType(feeTokenValidator),
  }),
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
