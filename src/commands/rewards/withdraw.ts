import { BaseCommand } from '@/lib/base';
import { Accounts, Config } from '@/domain';
import { KeyringFlags, TransactionFlags } from '@/flags';
import { buildStdFee, darkGreen, green } from '@/utils';
import { showSpinner } from '@/ui';
import { SuccessMessages } from '@/services';

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

    const config = await Config.init();

    this.log(`Withdrawing rewards from ${green(account.name)} (${darkGreen(account.address)})\n`);

    const result = await showSpinner(async () => {
      const signingClient = await config.getSigningArchwayClient(account);

      return signingClient.withdrawContractRewards(account.address, 0, buildStdFee(this.flags.fee?.coin));
    }, 'Waiting for tx to confirm...');

    SuccessMessages.rewards.withdraw(this, result);
  }
}
