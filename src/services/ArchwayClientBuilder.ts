import { ArchwayClient, SigningArchwayClient } from '@archwayhq/arch3.js';
import { StargateClient } from '@cosmjs/stargate';

import { Config } from '@/domain';
import { AccountWithSigner } from '@/types';

export const DefaultGasAdjustment = 1.3;

export const ArchwayClientBuilder = {
  /**
   * Get a Stargate client of the currently active chain in the project
   *
   * @param config - Instance of {@link Config} to use
   * @returns Promise containing the {@link StargateClient}
   */
  async getStargateClient(config: Config): Promise<StargateClient> {
    const rpcEndpoint = config.activeChainRpcEndpoint();

    return StargateClient.connect(rpcEndpoint);
  },

  /**
   * Get an Archway client of the currently active chain in the project
   *
   * @param config - Instance of {@link Config} to use
   * @returns Promise containing the {@link ArchwayClient}
   */
  async getArchwayClient(config: Config): Promise<ArchwayClient> {
    const rpcEndpoint = config.activeChainRpcEndpoint();

    return ArchwayClient.connect(rpcEndpoint);
  },

  /**
   * Get a Signing Archway client of the currently active chain in the project
   *
   * @param config - Instance of {@link Config} to use
   * @param account - Instance of {@link AccountWithSigner} to use as signer
   * @param account.signer
   * @param gasAdjustment - Optional - Gas adjustment to use in the client, defaults to {@link DefaultGasAdjustment}
   *
   * @returns Promise containing the {@link StargateClient}
   */
  async getSigningArchwayClient(
    config: Config,
    { signer }: AccountWithSigner,
    gasAdjustment?: number
  ): Promise<SigningArchwayClient> {
    const chainInfo = config.activeChainInfo();
    const rpcEndpoint = config.activeChainRpcEndpoint(chainInfo);

    return SigningArchwayClient.connectWithSigner(rpcEndpoint, signer, { gasAdjustment });
  },
};
