
import { Args } from '@oclif/core';

import { Config } from '@/domain';
import { BaseCommand } from '@/lib/base';
import { GlobalFlag } from '@/parameters/flags';
import { ConfigDataKey, ConfigDataKeys, ConfigDataValue } from '@/types';
import { bold, dim, greenBright } from '@/utils';

interface ConfigGetResult {
  default: ConfigDataValue;
  global: ConfigDataValue;
  local: ConfigDataValue;
}

/**
 * Command 'config get'
 * Query config settings in the local or global config files
 */
export default class ConfigGet extends BaseCommand<typeof ConfigGet> {
  static summary = 'Query config settings in the local or global config files';
  static args = {
    key: Args.custom<ConfigDataKey>({ options: ConfigDataKeys })({
      description: 'The config key to query',
      required: true,
      options: ConfigDataKeys,
    }),
  };

  static flags = {
    global: GlobalFlag,
  };

  static examples = [
    {
      description: 'Query the default chain id in the local config',
      command: '<%= config.bin %> <%= command.id %> chain-id',
    },
    {
      description: 'Query the default keyring-backend in the global config',
      command: '<%= config.bin %> <%= command.id %> -g chain-id',
    },
  ];

  /**
   * Runs the command.
   *
   * @returns Promise with the config value
   */
  public async run(): Promise<ConfigGetResult> {
    const config = await Config.init();

    const { global } = this.flags;
    const { key } = this.args;

    const defaultValue = config.data[key];
    const value = global ? config.globalData[key] : config.localData[key];

    this.log(`${bold(`${key}:`)} ${value ? greenBright(value) : `${dim('empty')} (defaults to ${greenBright(defaultValue)})`}`);

    return {
      default: defaultValue,
      local: config.localData[key],
      global: config.globalData[key]
    };
  }
}
