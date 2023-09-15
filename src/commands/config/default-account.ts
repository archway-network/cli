/* eslint-disable unicorn/filename-case */
import { Args } from '@oclif/core';

import { Config } from '@/domain';
import { BaseCommand } from '@/lib/base';
import { GlobalFlag } from '@/parameters/flags';
import { bold, greenBright, reset } from '@/utils';

/**
 * Command 'config default-account'
 * Query or update the default-account in the config file (local or global)
 */
export default class ConfigDefaultAccount extends BaseCommand<typeof ConfigDefaultAccount> {
  static summary = "Query or update the 'default-account' in the config file (local or global)";

  static args = {
    'default-account': Args.string({
      description: 'New value for the account that will be used by default if no --from flag is passed to other commands',
    }),
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
      const currentValue = global ? configFile.globalData['default-account'] : configFile.localData['default-account'];
      this.log(greenBright(currentValue || `Empty, ${reset.bold('default-account')} is not set`));

      if (this.jsonEnabled()) this.logJson({ 'default-account': currentValue || '' });
    }
  }

  protected async successMessage(defaultAccount: string, global: boolean): Promise<void> {
    this.success(`${greenBright(`Updated default-account ${global ? 'global' : 'local'} config to`)} ${bold(defaultAccount)}`);

    if (this.jsonEnabled()) this.logJson({ 'default-account': defaultAccount });
  }
}
