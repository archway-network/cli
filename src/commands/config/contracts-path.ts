/* eslint-disable unicorn/filename-case */
import { Args } from '@oclif/core';

import { Config, DEFAULT_CONFIG_DATA } from '@/domain';
import { BaseCommand } from '@/lib/base';
import { GlobalFlag } from '@/parameters/flags';
import { bold, greenBright, reset } from '@/utils';

/**
 * Command 'config contracts-path'
 * Query or update the contracts-path in the config file (local or global)
 */
export default class ConfigContractsPath extends BaseCommand<typeof ConfigContractsPath> {
  static summary = "Query or update the 'contracts-path' in the config file (local or global)";
  static args = {
    'contracts-path': Args.string({description: 'New value for the relative Path where the contracts are found in a project'}),
  };

  static flags = {
    global: GlobalFlag,
  };

  static examples = [
    {
      description: 'Query the contracts path in the local config',
      command: '<%= config.bin %> <%= command.id %>',
    },
    {
      description: 'Update the contracts path in the local config',
      command: '<%= config.bin %> <%= command.id %> "./other/path"',
    },
    {
      description: 'Query the contracts path in the global config',
      command: '<%= config.bin %> <%= command.id %> --global',
    },
    {
      description: 'Update the contracts path in the global config',
      command: '<%= config.bin %> <%= command.id %> "./other/path" --global',
    },
  ];

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
      const currentValue = global ? configFile.globalData['contracts-path'] : configFile.localData['contracts-path'];
      this.log(greenBright(currentValue || `Empty, defaults to: ${reset.bold(DEFAULT_CONFIG_DATA['contracts-path'])}`));

      if (this.jsonEnabled()) this.logJson({ 'contracts-path': currentValue || '' });
    }
  }

  protected async successMessage(contractsPath: string, global: boolean): Promise<void> {
    this.success(`${greenBright(`Updated contracts-path ${global ? 'global' : 'local'} config to`)} ${bold(contractsPath)}`);

    if (this.jsonEnabled()) this.logJson({ 'contracts-path': contractsPath });
  }
}
