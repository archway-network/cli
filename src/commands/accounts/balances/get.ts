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

  /**
   * Runs the command.
   *
   * @returns Empty promise
   */
  public async run(): Promise<void> {
    const config = await Config.init();
    const accountsDomain = await Accounts.init(this.flags['keyring-backend'] || config.keyringBackend, { filesPath: this.flags['keyring-path'] });

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
