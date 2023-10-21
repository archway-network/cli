import { Accounts, Config } from '@/domain';
import { BaseCommand } from '@/lib/base';
import { AccountRequiredArg } from '@/parameters/arguments';
import { KeyringFlags } from '@/parameters/flags';
import { AccountBalances } from '@/types';
import { showDisappearingSpinner } from '@/ui';
import { green, greenBright, prettyPrintBalancesList } from '@/utils';

/**
 * Command 'accounts balances get'
 * Access the bank module to query the balance of an address or account.
 */
export default class AccountsBalancesGet extends BaseCommand<typeof AccountsBalancesGet> {
  static summary = 'Query the balance of an address or account';
  static args = {
    account: AccountRequiredArg,
  };

  static flags = {
    ...KeyringFlags,
  };

  static examples = [
    {
      description: 'Query balance of an account',
      command: '<%= config.bin %> <%= command.id %> alice',
    },
    {
      description: 'Query balance of an address',
      command: '<%= config.bin %> <%= command.id %> archway13lq4qvmydry3p394jrrfuv2z5xemzdnsplqdrm',
    },
  ];

  /**
   * Runs the command.
   *
   * @returns Empty promise
   */
  public async run(): Promise<AccountBalances> {
    const config = await Config.init();
    const accountsDomain = Accounts.initFromFlags(this.flags, config);

    const result = await showDisappearingSpinner(async () => {
      const client = await config.getStargateClient();

      const { name, address } = accountsDomain.accountBaseFromAddress(this.args.account!);
      const balances = await client.getAllBalances(address);

      return {
        account: {
          name,
          address,
          balances,
        },
      };
    }, 'Querying balance');

    this.log(`Balances for account ${greenBright(result.account.name)} (${green(result.account.address)})\n`);
    this.log(prettyPrintBalancesList(result.account.balances, 'Empty wallet'));

    return result;
  }
}
