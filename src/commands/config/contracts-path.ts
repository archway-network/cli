/* eslint-disable unicorn/filename-case */
import { Args } from '@oclif/core';

import { BaseCommand } from '@/lib/base';
import { bold, greenBright, reset } from '@/utils';
import { Config, DEFAULT_CONFIG_DATA } from '@/domain';
import { GlobalFlag } from '@/parameters/flags';

/**
 * Command 'config contracts-path'
 * Updates the contracts-path config in the config file (local or global)
 */
export default class ConfigContractsPath extends BaseCommand<typeof ConfigContractsPath> {
  static summary = 'Gets the contracts-path config in the config file (local or global). If an additional argument is passed, it sets a new value';
  static args = {
    'contracts-path': Args.string({description: 'Relative Path where the contracts are found in a project'}),
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

    const global = this.flags.global;
    const contractsPath = this.args['contracts-path'];

    if (contractsPath) {
      configFile.update({ 'contracts-path': contractsPath }, global);

      await this.successMessage(contractsPath, global);
    } else {
      const currentValue = global ? configFile.globalConfigData['contracts-path'] : configFile.localConfigData['contracts-path'];
      this.log(greenBright(currentValue || `Empty, defaults to: ${reset.bold(DEFAULT_CONFIG_DATA['contracts-path'])}`));

      if (this.jsonEnabled()) this.logJson({ 'contracts-path': currentValue || '' });
    }
  }

  protected async successMessage(contractsPath: string, global: boolean): Promise<void> {
    this.success(`${greenBright(`Updated contracts-path ${global ? 'global' : 'local'} config to`)} ${bold(contractsPath)}`);

    if (this.jsonEnabled()) this.logJson({ 'contracts-path': contractsPath });
  }
}
