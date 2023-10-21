import { ux } from '@oclif/core';

import { ChainRegistry, Config } from '@/domain';
import { BaseCommand } from '@/lib/base';

export type ChainData = Record<string, boolean | number | string>;

/**
 * Command 'config chains list'
 * Lists all available chains to use
 */
export default class ConfigChainsList extends BaseCommand<typeof ConfigChainsList> {
  static summary = 'Lists all available chains to use';

  static flags = {
    ...ux.table.flags({ except: ['csv', 'output'] }),
  };

  /**
   * Runs the command.
   *
   * @returns Empty promise
   */
  public async run(): Promise<readonly ChainData[]> {
    const config = await Config.init();
    const chainRegistry = await ChainRegistry.init();

    const { flags } = await this.parse(ConfigChainsList);

    const chainsData = chainRegistry.chains.map(chain => {
      const {
        chain_id: chainId,
        chain_name: chainName,
        pretty_name: prettyName,
        fees: { fee_tokens: [{ denom: feeDenom }] = [] } = {},
        apis: { rpc: [{ address: rpcUrl }] = [] } = {},
      } = chain;

      return {
        current: config.chainId === chainId,
        chainId,
        chainName: prettyName || chainName,
        feeDenom,
        rpcUrl
      };
    });

    if (chainRegistry.warnings) {
      this.warning(chainRegistry.prettyPrintWarnings(config.chainId));
    }

    if (!this.jsonEnabled()) {
      ux.table(chainsData, {
        current: {
          header: 'Current',
          get: ({ current }) => current ? '   ✓' : '',
        },
        chainId: {
          header: 'Chain ID',
        },
        chainName: {
          header: 'Name',
        },
        feeDenom: {
          header: 'Fee Denom',
          extended: true,
        },
        rpcUrl: {
          header: 'RPC URL',
          extended: true,
        },
      }, {
        ...flags,
      });
    }

    return chainsData;
  }
}
