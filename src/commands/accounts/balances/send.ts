import { Flags } from '@oclif/core';

import { BaseCommand } from '@/lib/base';
import { Accounts, Config } from '@/domain';
import { KeyringFlags, TransactionFlags } from '@/flags';
import { AmountRequiredArg } from '@/arguments';
import { showSpinner } from '@/ui';
import { buildStdFee, bold, darkGreen, green, white, askForConfirmation } from '@/utils';
import { SuccessMessages } from '@/services';

import { AccountWithMnemonic, BackendType } from '@/types';

/**
 * Command 'accounts balances send'
 * This command will use the bank module to send coins from one account to another.
 */
export default class AccountsBalancesSend extends BaseCommand<typeof AccountsBalancesSend> {
  static summary = 'Send tokens from an address or account to another';
  static args = {
    amount: AmountRequiredArg,
  };

  static flags = {
    to: Flags.string({ description: 'Destination of the funds', required: true }),
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
    const fromAccount: AccountWithMnemonic = await accountsDomain.getWithMnemonic(this.flags.from!);
    const toAccount = await accountsDomain.accountBaseFromAddress(this.flags.to);
    const config = await Config.init();

    this.log(`Sending ${bold(this.args.amount!.plainText)}`);
    this.log(`From ${green(fromAccount.name)} (${darkGreen(fromAccount.address)})`);
    this.log(`To ${toAccount.name ? `${green(toAccount.name)} (${darkGreen(toAccount.address)})` : green(toAccount.address)}\n`);

    if (this.flags.confirm) await askForConfirmation();
    this.log();

    try {
      await showSpinner(async () => {
        const signingClient = await config.getSigningArchwayClient(fromAccount);

        fromAccount.mnemonic = '';

        await signingClient.sendTokens(fromAccount.address, toAccount.address, [this.args.amount!.coin], buildStdFee(this.flags.fee?.coin));
      }, 'Sending tokens');
    } catch (error: Error | any) {
      if (error?.message?.toString?.()?.includes('insufficient funds'))
        throw new Error(`Insufficient funds to send ${white.reset.bold(this.args.amount!.plainText)} from ${green(fromAccount.name)}`);
    }

    SuccessMessages.accounts.balances.send(this, this.args.amount!, fromAccount, toAccount);
  }
}
