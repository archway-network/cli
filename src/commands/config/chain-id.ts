/* eslint-disable unicorn/filename-case */
import { Args } from '@oclif/core';

import { ChainRegistry, Config } from '@/domain';
import { BaseCommand } from '@/lib/base';
import { GlobalFlag } from '@/parameters/flags';
import { bold, greenBright, reset } from '@/utils';

/**
 * Command 'config chain-id'
 * Query or update the chain-id in the config file (local or global)
 */
export default class ConfigChainId extends BaseCommand<typeof ConfigChainId> {
  static summary = "Query or update the 'chain-id' in the config file (local or global)";
  static args = {
    'chain-id': Args.string({ description: 'New value for the ID of the chain' }),
  };

  static flags = {
    global: GlobalFlag,
  };

  static examples = [
    {
      description: 'Query the chain id in the local config',
      command: '<%= config.bin %> <%= command.id %>',
    },
    {
      description: 'Update the chain id in the local config',
      command: '<%= config.bin %> <%= command.id %> constantine-3',
    },
    {
      description: 'Query the chain id in the global config',
      command: '<%= config.bin %> <%= command.id %> --global',
    },
    {
      description: 'Update the chain id in the global config',
      command: '<%= config.bin %> <%= command.id %> constantine-3 --global',
    },
  ];

  /**
   * Runs the command.
   *
   * @returns Empty promise
   */
  public async run(): Promise<void> {
    const configFile = await Config.init();
    const chainRegistry = await ChainRegistry.init();

    const { global } = this.flags;
    const chainId = this.args['chain-id'];

    if (chainId) {
      if (chainRegistry.warnings) {
        this.warning(chainRegistry.prettyPrintWarnings(chainId));
      }

      configFile.update({ 'chain-id': chainId }, global);

      await this.successMessage(chainId, global);
    } else {
      const currentValue = global ? configFile.globalData['chain-id'] : configFile.localData['chain-id'];
      this.log(greenBright(currentValue || `Empty, defaults to: ${reset.bold(configFile.chainId)}`));

      if (this.jsonEnabled()) {
        this.logJson({ 'chain-id': currentValue || '' });
      }
    }
  }

  protected async successMessage(chainId: string, global: boolean): Promise<void> {
    this.success(`${greenBright(`Updated chain-id ${global ? 'global' : 'local'} config to`)} ${bold(chainId)}`);

    if (this.jsonEnabled()) {
      this.logJson({ 'chain-id': chainId });
    }
  }
}
