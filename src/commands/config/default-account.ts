/* eslint-disable unicorn/filename-case */
import { Args } from '@oclif/core';

import { BaseCommand } from '@/lib/base';
import { bold, greenBright, reset } from '@/utils';
import { Config } from '@/domain';
import { GlobalFlag } from '@/parameters/flags';

/**
 * Command 'config default-account'
 * Updates the default-account config in the config file (local or global)
 */
export default class ConfigDefaultAccount extends BaseCommand<typeof ConfigDefaultAccount> {
  static summary =
    'Gets the default-account config in the config file (local or global). If an additional argument is passed, it sets a new value';

  static args = {
    'default-account': Args.string({ description: 'Account that will be used by default if no --from flag is passed to other commands' }),
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
    const defaultAccount = this.args['default-account'];

    if (defaultAccount) {
      configFile.update({ 'default-account': defaultAccount }, global);

      await this.successMessage(defaultAccount, global);
    } else {
      const currentValue = global ? configFile.globalConfigData['default-account'] : configFile.localConfigData['default-account'];
      this.log(greenBright(currentValue || `Empty, ${reset.bold('default-account')} is not set`));

      if (this.jsonEnabled()) this.logJson({ 'default-account': currentValue || '' });
    }
  }

  protected async successMessage(defaultAccount: string, global: boolean): Promise<void> {
    this.success(`${greenBright(`Updated default-account ${global ? 'global' : 'local'} config to`)} ${bold(defaultAccount)}`);

    if (this.jsonEnabled()) this.logJson({ 'default-account': defaultAccount });
  }
}
