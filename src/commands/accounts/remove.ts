import { BaseCommand } from '@/lib/base';
import { askForConfirmation, bold, green, yellow } from '@/utils';
import { AccountRequiredArg } from '@/parameters/arguments';
import { Accounts, Config } from '@/domain';
import { ForceFlag, KeyringFlags } from '@/parameters/flags';

import { AccountBase } from '@/types';

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
    const config = await Config.init();
    const accountsDomain = await Accounts.init(this.flags['keyring-backend'] || config.keyringBackend, { filesPath: this.flags['keyring-path'] });
    const accountInfo = await accountsDomain.keystore.assertAccountExists(this.args.account!);

    if (!this.jsonEnabled()) {
      this.warning(
        `${yellow('Attention:')} this will permanently delete the account ${bold.green(accountInfo.name)} (${green(
          accountInfo.address
        )})\n`
      );
    }

    await askForConfirmation(this.flags.force);

    await accountsDomain.remove(accountInfo.address);

    await this.successMessage(accountInfo);
  }

  protected async successMessage(account: AccountBase): Promise<void> {
    this.success(`${green('Account')} ${bold.green(account.name)} ${green('deleted')}`);

    if (this.jsonEnabled()) this.logJson(account);
  }
}
