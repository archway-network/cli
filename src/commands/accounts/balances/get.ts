import { BaseCommand } from '@/lib/base';
import { accountRequired } from '@/arguments';
import { KeyringFlags } from '@/flags';
import { Accounts, Config } from '@/domain';
import { bold, darkGreen, green, yellow } from '@/utils';
import { showSpinner } from '@/ui';

import { BackendType } from '@/types';

/**
 * Command 'accounts balances get'
 * Access the bank module to query the balance of an address or account.
 */
export default class AccountsBalancesGet extends BaseCommand<typeof AccountsBalancesGet> {
  static summary = 'Query the balance of an address or account';
  static args = {
    account: accountRequired,
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
    const config = await Config.open();

    const result = await showSpinner(async () => {
      const client = await config.getStargateClient();

      return accountsDomain.queryBalance(client, this.args.account!);
    }, 'Querying balance');

    if (this.jsonEnabled()) {
      this.logJson(result);
    } else {
      this.log(`Balances for account ${green(result.account.name)} (${darkGreen(result.account.address)})\n`);
      if (result.account.balances.length === 0) this.log(`- ${yellow('Empty wallet')}`);
      for (const item of result.account.balances) this.log(`- ${bold(item.amount)}${item.denom}`);
    }
  }
}
