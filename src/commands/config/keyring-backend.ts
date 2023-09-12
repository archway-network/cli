/* eslint-disable unicorn/filename-case */
import { Args } from '@oclif/core';

import { BaseCommand } from '@/lib/base';
import { bold, greenBright, reset } from '@/utils';
import { Config, DEFAULT_CONFIG_DATA } from '@/domain';
import { GlobalFlag } from '@/parameters/flags';
import { KeystoreBackendType } from '@/types';

/**
 * Command 'config keyring-backend'
 * Query or update the keyring-backend in the config file (local or global)
 */
export default class ConfigKeyringBackend extends BaseCommand<typeof ConfigKeyringBackend> {
  static summary = "Query or update the 'keyring-backend' in the config file (local or global)";

  static args = {
    'keyring-backend': Args.custom({
      description: 'New value for the keyring backend for account management (os/file/test)',
      parse: async (val?: string): Promise<KeystoreBackendType | undefined> => (val ? (val as KeystoreBackendType) : undefined),
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
    const keyringBackend = this.args['keyring-backend'];

    if (keyringBackend) {
      configFile.update({ 'keyring-backend': keyringBackend }, global);

      await this.successMessage(keyringBackend, global);
    } else {
      const currentValue = global ? configFile.globalConfigData['keyring-backend'] : configFile.localConfigData['keyring-backend'];
      this.log(greenBright(currentValue || `Empty, defaults to: ${reset.bold(DEFAULT_CONFIG_DATA['keyring-backend'])}`));

      if (this.jsonEnabled()) this.logJson({ 'keyring-backend': currentValue || '' });
    }
  }

  protected async successMessage(keyringBackend: string, global: boolean): Promise<void> {
    this.success(`${greenBright(`Updated keyring-backend ${global ? 'global' : 'local'} config to`)} ${bold(keyringBackend)}`);

    if (this.jsonEnabled()) this.logJson({ 'keyring-backend': keyringBackend });
  }
}
