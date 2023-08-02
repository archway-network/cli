import { BaseCommand } from '@/lib/base';
import { Accounts, Config } from '@/domain';
import { KeyringFlags, TransactionFlags } from '@/flags';
import { bold, buildStdFee, darkGreen, green, yellow } from '@/utils';
import { showSpinner } from '@/ui';

import { AccountWithMnemonic, BackendType } from '@/types';

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
    const account: AccountWithMnemonic = await accountsDomain.getWithMnemonic(this.flags.from!);

    const config = await Config.open();

    this.log(`Withdrawing rewards from ${green(account.name)} (${darkGreen(account.address)})\n`);

    const result = await showSpinner(async () => {
      const signingClient = await config.getSigningArchwayClient(account);

      return signingClient.withdrawContractRewards(account.address, 0, buildStdFee(this.flags.fee?.coin));
    }, 'Waiting for tx to confirm...');

    if (result.rewards.length === 0) {
      this.log(yellow('No outstanding rewards'));
    } else {
      this.success(darkGreen('Successfully claimed the following rewards:\n'));
      for (const item of result.rewards) this.log(`- ${bold(item.amount)}${item.denom}`);
    }
  }
}
