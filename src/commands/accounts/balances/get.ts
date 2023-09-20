import { BaseCommand } from '@/lib/base';
import { AccountRequiredArg } from '@/parameters/arguments';
import { KeyringFlags } from '@/parameters/flags';
import { Accounts, Config } from '@/domain';
import { showDisappearingSpinner } from '@/ui';
import { green, greenBright, prettyPrintBalancesList } from '@/utils';

import { AccountBalancesJSON } from '@/types';

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
  public async run(): Promise<void> {
    const config = await Config.init();
    const accountsDomain = await Accounts.initFromFlags(this.flags, config);

    const result = await showDisappearingSpinner(async () => {
      const client = await config.getStargateClient();

      return accountsDomain.queryBalance(client, this.args.account!);
    }, 'Querying balance');

    await this.successMessage(result);
  }

  protected async successMessage(balance: AccountBalancesJSON): Promise<void> {
    this.log(`Balances for account ${greenBright(balance.account.name)} (${green(balance.account.address)})\n`);
    this.log(prettyPrintBalancesList(balance.account.balances, 'Empty wallet'));

    if (this.jsonEnabled()) this.logJson(balance);
  }
}
