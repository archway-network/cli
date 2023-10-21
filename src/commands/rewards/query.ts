import { OutstandingRewards } from '@archwayhq/arch3.js/build';

import { Accounts, Config } from '@/domain';
import { BaseCommand } from '@/lib/base';
import { AccountRequiredArg } from '@/parameters/arguments';
import { KeyringFlags } from '@/parameters/flags';
import { ArchwayClientBuilder } from '@/services';
import { showDisappearingSpinner } from '@/ui';
import { green, greenBright, prettyPrintBalancesList } from '@/utils';

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
   * @returns Promise containing a {@link OutstandingRewards}
   */
  public async run(): Promise<OutstandingRewards> {
    const config = await Config.init();
    const accountsDomain = Accounts.initFromFlags(this.flags, config);

    const account = accountsDomain.accountBaseFromAddress(this.args.account!);

    const result = await showDisappearingSpinner(async () => {
      const client = await ArchwayClientBuilder.getArchwayClient(config);
      return client.getOutstandingRewards(account.address);
    }, 'Querying rewards...');

    this.log(
      `Outstanding rewards for ${account.name ? `${greenBright(account.name)} (${green(account.address)})` : greenBright(account.address)}\n`
    );
    this.log(prettyPrintBalancesList(result.totalRewards, '💸 No outstanding rewards'));

    return result;
  }
}
