import { BaseCommand } from '@/lib/base';
import { bold, darkGreen, yellow } from '@/utils/style';
import { accountRequired } from '@/arguments/account';
import { Accounts } from '@/domain/Accounts';
import { checkConfirmation, forceFlag } from '@/flags/force';
import { KeyringFlags } from '@/flags/keyring';

import { BackendType } from '@/types/Account';

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
    force: forceFlag(),
    ...KeyringFlags,
  };

  /**
   * Runs the command.
   *
   * @returns Empty promise
   */
  public async run(): Promise<void> {
    const accountsDomain = await Accounts.init(this.flags['keyring-backend'] as BackendType, { filesPath: this.flags['keyring-path'] });
    const accountInfo = await accountsDomain.keystore.assertAccountExists(this.args.account);

    this.warning(
      `${yellow('Attention:')} this will permanently delete the account ${bold.green(accountInfo.name)}\n(${darkGreen(
        accountInfo.address
      )})\n`
    );
    await checkConfirmation(this.flags.force);

    await accountsDomain.keystore.remove(accountInfo.address);

    this.log('\n');
    this.success(`${darkGreen('Account')} ${bold.green(accountInfo.name)} ${darkGreen('deleted')}`);
  }
}
