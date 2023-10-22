import path from 'node:path';

import { Config } from '@/domain';
import { BaseCommand } from '@/lib/base';
import { CustomFlags } from '@/parameters/flags';
import { Prompts } from '@/services';
import { ConfigData } from '@/types';
import { bold, green } from '@/utils';

/**
 * Command 'config init'
 * Initializes a config file for the current project
 */
export default class ConfigInit extends BaseCommand<typeof ConfigInit> {
  static summary = 'Initializes a config file for the current project';
  static flags = {
    chain: CustomFlags.chainId(),
  };

  static examples = [
    {
      description: 'Initialize a config file',
      command: '<%= config.bin %> <%= command.id %>',
    },
    {
      description: 'Initialize a config file with a chain id',
      command: '<%= config.bin %> <%= command.id %> --chain="constantine-3"',
    },
  ];

  /**
   * Runs the command.
   *
   * @returns Promise with a {@link ConfigData}
   */
  public async run(): Promise<ConfigData> {
    const config = await Config.create(this.flags.chain || (await Prompts.chain()));

    const configFile = await config.getConfigPath();
    const relativePath = path.relative(process.cwd(), configFile);

    this.success(`${green('Config file')} ${bold(relativePath)} ${green('created')}`);

    return config.localData;
  }
}
