import { WithdrawContractRewardsResult } from '@archwayhq/arch3.js/build';

import { BaseCommand } from '@/lib/base';
import { Accounts, Config } from '@/domain';
import { KeyringFlags, TransactionFlags } from '@/parameters/flags';
import { bold, buildStdFee, green, greenBright, yellow } from '@/utils';
import { showDisappearingSpinner } from '@/ui';

import { Account } from '@/types';

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
   * @returns Empty promise
   */
  public async run(): Promise<void> {
    const config = await Config.init();
    const accountsDomain = await Accounts.initFromFlags(this.flags, config);

    const accountWithSigner = await accountsDomain.getWithSigner(this.flags.from!);

    await this.logTransactionDetails(accountWithSigner.account);

    const result = await showDisappearingSpinner(async () => {
      const signingClient = await config.getSigningArchwayClient(accountWithSigner, this.flags['gas-adjustment']);

      return signingClient.withdrawContractRewards(accountWithSigner.account.address, 0, buildStdFee(this.flags.fee?.coin));
    }, 'Waiting for tx to confirm...');

    await this.successMessage(result);
  }

  protected async logTransactionDetails(account: Account): Promise<void> {
    this.log(`Withdrawing rewards from ${greenBright(account.name)} (${green(account.address)})\n`);
  }

  protected async successMessage(result: WithdrawContractRewardsResult): Promise<void> {
    if (result.rewards.length === 0) {
      this.log(yellow('No outstanding rewards'));
    } else {
      this.success(green('Successfully claimed the following rewards:\n'));
      for (const item of result.rewards) this.log(`- ${bold(item.amount)}${item.denom}`);
    }

    if (this.jsonEnabled()) this.logJson(result);
  }
}
