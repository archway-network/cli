/* eslint-disable unicorn/filename-case */
import { Args } from '@oclif/core';

import { BaseCommand } from '@/lib/base';
import { bold, greenBright, reset } from '@/utils';
import { Config, DEFAULT_CONFIG_DATA } from '@/domain';
import { GlobalFlag } from '@/parameters/flags';
import { KeystoreBackendType } from '@/types';

/**
 * Command 'config keyring-path'
 * Updates the keyring-path config in the config file (local or global)
 */
export default class ConfigKeyringPath extends BaseCommand<typeof ConfigKeyringPath> {
  static summary =
    'Gets the keyring-path config in the config file (local or global). If an additional argument is passed, it sets a new value';

  static args = {
    'keyring-path': Args.custom({
      description: "Keyring path where accounts will be stored when 'keyring-backend' is set to 'file'",
      parse: async (val?: string): Promise<KeystoreBackendType | undefined> => val ? val as KeystoreBackendType : undefined,
      options: Object.values(KeystoreBackendType),
    })(),
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
    const keyringPath = this.args['keyring-path'];

    if (keyringPath) {
      configFile.update({ 'keyring-path': keyringPath }, global);

      await this.successMessage(keyringPath, global);
    } else {
      const currentValue = global ? configFile.globalConfigData['keyring-path'] : configFile.localConfigData['keyring-path'];
      this.log(greenBright(currentValue || `Empty, defaults to: ${reset.bold(DEFAULT_CONFIG_DATA['keyring-path'])}`));

      if (this.jsonEnabled()) this.logJson({ 'keyring-path': currentValue || '' });
    }
  }

  protected async successMessage(keyringPath: string, global: boolean): Promise<void> {
    this.success(`${greenBright(`Updated keyring-path ${global ? 'global' : 'local'} config to`)} ${bold(keyringPath)}`);

    if (this.jsonEnabled()) this.logJson({ 'keyring-path': keyringPath });
  }
}
