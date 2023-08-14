import { BaseCommand } from '@/lib/base';
import { AccountRequiredArg } from '@/parameters/arguments';
import { KeyringFlags } from '@/parameters/flags';
import { Accounts, Config } from '@/domain';
import { showDisappearingSpinner } from '@/ui';

import { AccountBalancesJSON, BackendType } from '@/types';
import { bold, darkGreen, green, yellow } from '@/utils';

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
    const accountsDomain = await Accounts.init(this.flags['keyring-backend'] as BackendType, { filesPath: this.flags['keyring-path'] });
    const config = await Config.init();

    const result = await showDisappearingSpinner(async () => {
      const client = await config.getStargateClient();

      return accountsDomain.queryBalance(client, this.args.account!);
    }, 'Querying balance');

    await this.successMessage(result);
  }

  protected async successMessage(balance: AccountBalancesJSON): Promise<void> {
    if (this.jsonEnabled()) {
      this.logJson(balance);
    } else {
      this.log(`Balances for account ${green(balance.account.name)} (${darkGreen(balance.account.address)})\n`);
      if (balance.account.balances.length === 0) this.log(`- ${yellow('Empty wallet')}`);
      for (const item of balance.account.balances) this.log(`- ${bold(item.amount)}${item.denom}`);
    }
  }
}
