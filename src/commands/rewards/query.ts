import { OutstandingRewards } from '@archwayhq/arch3.js/build';

import { green, greenBright, prettyPrintBalancesList } from '@/utils';
import { BaseCommand } from '@/lib/base';
import { AccountRequiredArg } from '@/parameters/arguments';
import { Accounts, Config } from '@/domain';
import { KeyringFlags } from '@/parameters/flags';
import { showDisappearingSpinner } from '@/ui';

import { AccountBase } from '@/types';

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

  static examples = [
    {
      description: 'Query the outstanding rewards for an account by name',
      command: '<%= config.bin %> <%= command.id %> alice',
    },
    {
      description: 'Query the outstanding rewards for an account by address',
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

    const account = await accountsDomain.accountBaseFromAddress(this.args.account!);

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
