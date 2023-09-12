/* eslint-disable unicorn/filename-case */
import { Args } from '@oclif/core';

import { BaseCommand } from '@/lib/base';
import { bold, greenBright, reset } from '@/utils';
import { ChainRegistry, Config, DEFAULT_CONFIG_DATA } from '@/domain';
import { GlobalFlag } from '@/parameters/flags';

/**
 * Command 'config chain-id'
 * Query or update the chain-id in the config file (local or global)
 */
export default class ConfigChainId extends BaseCommand<typeof ConfigChainId> {
  static summary = "Query or update the 'chain-id' in the config file (local or global)";
  static args = {
    'chain-id': Args.string({description: 'New value for the ID of the chain'}),
  };

  static flags = {
    global: GlobalFlag,
  };

  /**
   * Runs the command.
   *
   * @returns Empty promise
   */
  public async run(): Promise<void> {
    const configFile = await Config.init();
    const chainRegistry = await ChainRegistry.init();

    const global = this.flags.global;
    const chainId = this.args['chain-id'];

    if (chainId) {
      if (chainRegistry.warnings) this.warning(chainRegistry.prettyPrintWarnings(chainId));

      configFile.update({ 'chain-id': chainId }, global);

      await this.successMessage(chainId, global);
    } else {
      const currentValue = global ? configFile.globalConfigData['chain-id'] : configFile.localConfigData['chain-id'];
      this.log(greenBright(currentValue || `Empty, defaults to: ${reset.bold(DEFAULT_CONFIG_DATA['chain-id'])}`));

      if (this.jsonEnabled()) this.logJson({ 'chain-id': currentValue || '' });
    }
  }

  protected async successMessage(chainId: string, global: boolean): Promise<void> {
    this.success(`${greenBright(`Updated chain-id ${global ? 'global' : 'local'} config to`)} ${bold(chainId)}`);

    if (this.jsonEnabled()) this.logJson({ 'chain-id': chainId });
  }
}
