import { BaseCommand } from '@/lib/base';
import { bold, darkGreen, yellow } from '@/utils';
import { accountRequired } from '@/arguments';
import { Accounts } from '@/domain';
import { askForConfirmation, forceFlag, KeyringFlags } from '@/flags';

import { BackendType } from '@/types';

/**
 * Command 'accounts remove'
 * Removes an account from the keystore
 */
export default class AccountsRemove extends BaseCommand<typeof AccountsRemove> {
  static summary = 'Removes an account from the keystore';
  static args = {
    account: accountRequired,
  };

  static flags = {
    force: forceFlag,
    ...KeyringFlags,
  };

  /**
   * Runs the command.
   *
   * @returns Empty promise
   */
  public async run(): Promise<void> {
    const accountsDomain = await Accounts.init(this.flags['keyring-backend'] as BackendType, { filesPath: this.flags['keyring-path'] });
    const accountInfo = await accountsDomain.keystore.assertAccountExists(this.args.account!);

    this.warning(
      `${yellow('Attention:')} this will permanently delete the account ${bold.green(accountInfo.name)} (${darkGreen(
        accountInfo.address
      )})\n`
    );
    await askForConfirmation(this.flags.force);

    await accountsDomain.remove(accountInfo.address);

    this.log();
    this.success(`${darkGreen('Account')} ${bold.green(accountInfo.name)} ${darkGreen('deleted')}`);
  }
}
