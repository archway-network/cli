import { OutstandingRewards } from '@archwayhq/arch3.js/build';

import { green, greenBright, prettyPrintBalancesList } from '@/utils';
import { BaseCommand } from '@/lib/base';
import { AccountRequiredArg } from '@/parameters/arguments';
import { Accounts, Config } from '@/domain';
import { KeyringFlags } from '@/parameters/flags';
import { showDisappearingSpinner } from '@/ui';

import { AccountBase, BackendType } from '@/types';

/**
 * Command 'rewards query'
 * Queries the outstanding rewards for a specific account or address.
 */
export default class RewardsQuery extends BaseCommand<typeof RewardsQuery> {
  static summary = 'Queries the outstanding rewards for a specific account or address';
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
    const account = await accountsDomain.accountBaseFromAddress(this.args.account!);

    const config = await Config.init();

    const result = await showDisappearingSpinner(async () => {
      const client = await config.getArchwayClient();

      return client.getOutstandingRewards(account.address);
    }, 'Querying rewards...');

    await this.successMessage(result, account);
  }

  protected async successMessage(result: OutstandingRewards, account: AccountBase): Promise<void> {
    this.log(
      `Outstanding rewards for ${account.name ? `${greenBright(account.name)} (${green(account.address)})` : greenBright(account.address)}\n`
    );
    this.log(prettyPrintBalancesList(result.totalRewards, 'No outstanding rewards'))

    if (this.jsonEnabled()) this.logJson(result);
  }
}
