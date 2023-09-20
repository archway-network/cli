/* eslint-disable unicorn/filename-case */
import { Args } from '@oclif/core';

import { Config, DEFAULT_CONFIG_DATA } from '@/domain';
import { BaseCommand } from '@/lib/base';
import { GlobalFlag } from '@/parameters/flags';
import { KeystoreBackendType } from '@/types';
import { bold, greenBright, reset } from '@/utils';

/**
 * Command 'config keyring-path'
 * Query or update the keyring-path in the config file (local or global)
 */
export default class ConfigKeyringPath extends BaseCommand<typeof ConfigKeyringPath> {
  static summary = "Query or update the 'keyring-path' in the config file (local or global)";

  static args = {
    'keyring-path': Args.custom({
      description: "New value for the keyring path where accounts will be stored when 'keyring-backend' is set to 'file'",
      parse: async (val?: string): Promise<KeystoreBackendType | undefined> => (val ? (val as KeystoreBackendType) : undefined),
      options: Object.values(KeystoreBackendType),
    })(),
  };

  static flags = {
    global: GlobalFlag,
  };

  static examples = [
    {
      description: 'Query the path for the file keyring in the local config',
      command: '<%= config.bin %> <%= command.id %>',
    },
    {
      description: 'Update the path for the file keyring in the local config',
      command: '<%= config.bin %> <%= command.id %> "/file/keys/custom/path"',
    },
    {
      description: 'Query the path for the file keyring in the global config',
      command: '<%= config.bin %> <%= command.id %> --global',
    },
    {
      description: 'Update the path for the file keyring in the global config',
      command: '<%= config.bin %> <%= command.id %> "/file/keys/custom/path" --global',
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
    const keyringPath = this.args['keyring-path'];

    if (keyringPath) {
      configFile.update({ 'keyring-path': keyringPath }, global);

      await this.successMessage(keyringPath, global);
    } else {
      const currentValue = global ? configFile.globalData['keyring-path'] : configFile.localData['keyring-path'];
      this.log(greenBright(currentValue || `Empty, defaults to: ${reset.bold(DEFAULT_CONFIG_DATA['keyring-path'])}`));

      if (this.jsonEnabled()) this.logJson({ 'keyring-path': currentValue || '' });
    }
  }

  protected async successMessage(keyringPath: string, global: boolean): Promise<void> {
    this.success(`${greenBright(`Updated keyring-path ${global ? 'global' : 'local'} config to`)} ${bold(keyringPath)}`);

    if (this.jsonEnabled()) this.logJson({ 'keyring-path': keyringPath });
  }
}
