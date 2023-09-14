import { Accounts, Config } from '@/domain';
import { BaseCommand } from '@/lib/base';
import { AccountRequiredArg } from '@/parameters/arguments';
import { KeyringFlags, NoConfirmFlag } from '@/parameters/flags';
import { askForConfirmation, bold, green, yellow } from '@/utils';

import { AccountBase } from '@/types';

/**
 * Command 'accounts remove'
 * Removes an account from the keyring
 */
export default class AccountsRemove extends BaseCommand<typeof AccountsRemove> {
  static summary = 'Removes an account from the keyring';
  static args = {
    account: AccountRequiredArg,
  };

  static flags = {
    'no-confirm': NoConfirmFlag,
    ...KeyringFlags,
  };

  static examples = [
    {
      description: 'Remove an account',
      command: '<%= config.bin %> <%= command.id %> alice',
    },
    {
      description: 'Remove an account without confirmation prompt',
      command: '<%= config.bin %> <%= command.id %> alice --no-confirm',
    },
  ];

  /**
   * Runs the command.
   *
   * @returns Empty promise
   */
  public async run(): Promise<void> {
    const config = await Config.init();
    const accountsDomain = await Accounts.initFromFlags(this.flags, config);
    const accountInfo = await accountsDomain.get(this.args.account!);

    if (!this.jsonEnabled()) {
      this.warning(
        `${yellow('Attention:')} this will permanently delete the account ${bold.green(accountInfo.name)} (${green(
          accountInfo.address
        )})\n`
      );
    }

    await askForConfirmation(this.flags['no-confirm']);

    await accountsDomain.remove(accountInfo.address);

    await this.successMessage(accountInfo);
  }

  protected async successMessage(account: AccountBase): Promise<void> {
    this.success(`${green('Account')} ${bold.green(account.name)} ${green('deleted')}`);
    if (this.jsonEnabled()) {
      this.logJson(account)
    }
  }
}
