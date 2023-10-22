
import { Args } from '@oclif/core';

import { Config } from '@/domain';
import { BaseCommand } from '@/lib/base';
import { GlobalFlag } from '@/parameters/flags';
import { ConfigData, ConfigDataKey, ConfigDataKeys, ConfigDataValue } from '@/types';
import { bold, green, white } from '@/utils';

/**
 * Command 'config set'
 * Update config settings in the local or global config files
 */
export default class ConfigSet extends BaseCommand<typeof ConfigSet> {
  static summary = 'Update config settings in the local or global config files';
  static args = {
    key: Args.custom<ConfigDataKey>({ options: ConfigDataKeys })({
      description: 'The config key to set',
      required: true,
    }),
    value: Args.custom<ConfigDataValue>({})({
      description: 'The config value',
      required: true,
    }),
  };

  static flags = {
    global: GlobalFlag,
  };

  static examples = [
    {
      description: 'Sets the default chain id in the global config',
      command: '<%= config.bin %> <%= command.id %> -g chain-id archway-1',
    },
    {
      description: 'Use the test keyring-backend in the current project',
      command: '<%= config.bin %> <%= command.id %> keyring-backend test',
    },
    {
      description: 'Update the path for the file keyring in the global config',
      command: '<%= config.bin %> <%= command.id %> --global keyring-path "~/.keys"',
    },
  ];

  /**
   * Runs the command.
   *
   * @returns Promise with the partial {@link ConfigData} that was updated
   */
  public async run(): Promise<Partial<ConfigData>> {
    const config = await Config.init();

    const { global } = this.flags;
    const { key, value } = this.args;
    const partialConfig = { [key]: value };

    await config.update(partialConfig, global);

    this.success(green(`Updated ${bold(key)} in ${(global ? 'global' : 'local')} config to ${white.bold(value)}`));

    return partialConfig;
  }
}
