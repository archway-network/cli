import { BaseCommand } from '@/lib/base';
import { AccountRequiredArg } from '@/arguments';
import { Accounts, Config } from '@/domain';
import { KeyringFlags } from '@/flags';
import { showSpinner } from '@/ui';
import { SuccessMessages } from '@/services';

import { BackendType } from '@/types';

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

    const result = await showSpinner(async () => {
      const client = await config.getArchwayClient();

      return client.getOutstandingRewards(account.address);
    }, 'Querying rewards...');

    SuccessMessages.rewards.query(this, result, account);
  }
}
