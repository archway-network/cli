import { Accounts, Config } from '@/domain';
import { BaseCommand } from '@/lib/base';
import { AccountRequiredArg } from '@/parameters/arguments';
import { KeyringFlags, NoConfirmFlag } from '@/parameters/flags';
import { Prompts } from '@/services';
import { AccountBase } from '@/types';
import { bold, green, yellow } from '@/utils';

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
   * @returns Promise containing the name and address of the deleted account
   */
  public async run(): Promise<AccountBase> {
    const config = await Config.init();
    const accountsDomain = await Accounts.initFromFlags(this.flags, config);

    const accountBaseInfo = await accountsDomain.findAccountBase(this.args.account!);

    this.warning(
      `${yellow('Attention:')} this will permanently delete the account ${bold.green(accountBaseInfo.name)} (${green(
        accountBaseInfo.address
      )})\n`
    );

    await Prompts.askForConfirmation(this.flags['no-confirm']);

    await accountsDomain.remove(accountBaseInfo.address);

    this.success(`${green('Account')} ${bold.green(accountBaseInfo.name)} ${green('deleted')}`);

    return accountBaseInfo;
  }
}
