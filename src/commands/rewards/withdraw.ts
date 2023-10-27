
import { WithdrawContractRewardsResult } from '@archwayhq/arch3.js/build';

import { Accounts, Config } from '@/domain';
import { BaseCommand } from '@/lib/base';
import { KeyringFlags, TransactionFlags } from '@/parameters/flags';
import { ArchwayClientBuilder } from '@/services';
import { AccountWithSigner } from '@/types';
import { showDisappearingSpinner } from '@/ui';
import { bold, buildStdFee, green, greenBright } from '@/utils';

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

  static examples = [
    {
      description: 'Withdraw the rewards for an account, by name',
      command: '<%= config.bin %> <%= command.id %> --from "alice"',
    },
    {
      description: 'Query the outstanding rewards for an account, by address',
      command: '<%= config.bin %> <%= command.id %> --from "archway13lq4qvmydry3p394jrrfuv2z5xemzdnsplqdrm"',
    },
  ];

  /**
   * Runs the command.
   *
   * @returns Promise containing a {@link WithdrawContractRewardsResult}
   */
  public async run(): Promise<WithdrawContractRewardsResult> {
    const config = await Config.init();
    const accountsDomain = Accounts.initFromFlags(this.flags, config);

    const accountWithSigner = await accountsDomain.getWithSigner(this.flags.from);

    this.log(`Withdrawing rewards from ${greenBright(accountWithSigner.account.name)} (${green(accountWithSigner.account.address)})\n`);

    const result = await showDisappearingSpinner(
      async () => this.withdraw(config, accountWithSigner),
      'Waiting for tx to confirm...'
    );

    if (result.rewards.length === 0) {
      this.log('💸 No outstanding rewards');
    } else {
      this.success(green('Rewards claimed:'));
      for (const item of result.rewards) {
        this.log(`- ${bold(item.amount)}${item.denom}`);
      }
    }

    return result;
  }

  private async withdraw(config: Config, accountWithSigner: AccountWithSigner): Promise<WithdrawContractRewardsResult> {
    const signingClient = await ArchwayClientBuilder.getSigningArchwayClient(
      config,
      accountWithSigner,
      this.flags['gas-adjustment']
    );

    return signingClient.withdrawContractRewards(
      accountWithSigner.account.address,
      0,
      buildStdFee(this.flags.fee?.coin)
    );
  }
}
