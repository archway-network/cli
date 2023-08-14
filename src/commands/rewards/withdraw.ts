import { BaseCommand } from '@/lib/base';
import { Accounts, Config } from '@/domain';
import { KeyringFlags, TransactionFlags } from '@/parameters/flags';
import { bold, buildStdFee, darkGreen, green, yellow } from '@/utils';
import { showDisappearingSpinner } from '@/ui';

import { Account, BackendType } from '@/types';
import { WithdrawContractRewardsResult } from '@archwayhq/arch3.js/build';

/**
 * Command 'rewards withdraw'
 * Withdraws rewards for a specific account
 */
export default class RewardsWithdraw extends BaseCommand<typeof RewardsWithdraw> {
  static summary = 'Withdraws rewards for a specific account';

  static flags = {
    ...KeyringFlags,
    ...TransactionFlags,
  };

  /**
   * Runs the command.
   *
   * @returns Empty promise
   */
  public async run(): Promise<void> {
    const accountsDomain = await Accounts.init(this.flags['keyring-backend'] as BackendType, { filesPath: this.flags['keyring-path'] });
    const account: Account = await accountsDomain.getWithMnemonic(this.flags.from!);

    const config = await Config.init();

    await this.logTransactionDetails(account);

    const result = await showDisappearingSpinner(async () => {
      const signingClient = await config.getSigningArchwayClient(account);

      return signingClient.withdrawContractRewards(account.address, 0, buildStdFee(this.flags.fee?.coin));
    }, 'Waiting for tx to confirm...');

    await this.successMessage(result);
  }

  protected async logTransactionDetails(account: Account): Promise<void> {
    this.log(`Withdrawing rewards from ${green(account.name)} (${darkGreen(account.address)})\n`);
  }

  protected async successMessage(result: WithdrawContractRewardsResult): Promise<void> {
    if (result.rewards.length === 0) {
      this.log(yellow('No outstanding rewards'));
    } else {
      this.success(darkGreen('Successfully claimed the following rewards:\n'));
      for (const item of result.rewards) this.log(`- ${bold(item.amount)}${item.denom}`);
    }
  }
}
