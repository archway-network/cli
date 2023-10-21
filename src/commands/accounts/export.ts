import { Accounts, Config } from '@/domain';
import { BaseCommand } from '@/lib/base';
import { AccountRequiredArg } from '@/parameters/arguments';
import { KeyringFlags, NoConfirmFlag } from '@/parameters/flags';
import { Prompts } from '@/services';
import { Account } from '@/types';
import { blueBright, bold, green, yellow } from '@/utils';

/**
 * Command 'accounts export'
 * Exports an account's private key from the keyring
 */
export default class AccountsExport extends BaseCommand<typeof AccountsExport> {
  static args = {
    account: AccountRequiredArg,
  };

  static examples = [
    {
      command: '<%= config.bin %> <%= command.id %> alice',
      description: 'Export a private key',
    },
    {
      command: '<%= config.bin %> <%= command.id %> alice --no-confirm',
      description: 'Export a private key without confirmation prompt',
    },
  ];

  static flags = {
    'no-confirm': NoConfirmFlag,
    ...KeyringFlags,
  };

  static summary = "Exports an account's private key from the keyring";

  public async run(): Promise<Account> {
    const config = await Config.init();
    const accountsDomain = Accounts.initFromFlags(this.flags, config);
    const account = await accountsDomain.export(this.args.account!);

    const accountData = `${bold.green(account.name)} (${green(account.address)})`;
    this.warning(`${yellow.bold('WARNING:')} The private key for the account ${accountData} will be exported as an unarmored hexadecimal string. USE AT YOUR OWN RISK.\n`);

    await Prompts.askForConfirmation(this.flags['no-confirm']);

    this.success(`Private key: ${blueBright(account.privateKey)}`);

    return account;
  }
}
