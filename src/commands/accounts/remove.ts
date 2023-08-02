import { BaseCommand } from '@/lib/base';
import { askForConfirmation, bold, darkGreen, yellow } from '@/utils';
import { AccountRequiredArg } from '@/arguments';
import { Accounts } from '@/domain';
import { ForceFlag, KeyringFlags } from '@/flags';
import { SuccessMessages } from '@/services';

import { BackendType } from '@/types';

/**
 * Command 'accounts remove'
 * Removes an account from the keystore
 */
export default class AccountsRemove extends BaseCommand<typeof AccountsRemove> {
  static summary = 'Removes an account from the keystore';
  static args = {
    account: AccountRequiredArg,
  };

  static flags = {
    force: ForceFlag,
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

    if (!this.jsonEnabled()) {
      this.warning(
        `${yellow('Attention:')} this will permanently delete the account ${bold.green(accountInfo.name)} (${darkGreen(
          accountInfo.address
        )})\n`
      );
    }

    await askForConfirmation(this.flags.force);

    await accountsDomain.remove(accountInfo.address);

    SuccessMessages.accounts.remove(this, accountInfo);
  }
}
