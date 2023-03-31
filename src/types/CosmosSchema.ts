/* eslint-disable camelcase */

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

export interface StakingToken {
  denom: string;
}

export interface Peer {
  id: string;
  address: string;
  provider?: string;
}

export interface Endpoint {
  address: string;
  provider?: string;
  archive?: boolean;
}

export interface Explorer {
  kind?: string;
  url?: string;
  tx_page?: string;
  account_page?: string;
}
