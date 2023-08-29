import { Flags } from '@oclif/core';

import { BaseCommand } from '@/lib/base';
import { Accounts, Config } from '@/domain';
import { KeyringFlags, TransactionFlags } from '@/parameters/flags';
import { AmountRequiredArg } from '@/parameters/arguments';
import { showDisappearingSpinner } from '@/ui';
import { buildStdFee, green, greenBright, white, askForConfirmation, prettyPrintCoin } from '@/utils';

import { Account, AccountBase, Amount, BackendType } from '@/types';

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
    const from = await accountsDomain.getWithSigner(this.flags.from!);
    const toAccount: AccountBase = await accountsDomain.accountBaseFromAddress(this.flags.to);
    const config = await Config.init();

    await this.logTransactionDetails(from.account, toAccount);

    if (this.flags.confirm) await askForConfirmation();
    this.log();

    try {
      await showDisappearingSpinner(async () => {
        const signingClient = await config.getSigningArchwayClient(from, this.flags['gas-adjustment']);

        from.account.mnemonic = '';

        await signingClient.sendTokens(from.account.address, toAccount.address, [this.args.amount!.coin], buildStdFee(this.flags.fee?.coin));
      }, 'Sending tokens');
    } catch (error: Error | any) {
      throw error?.message?.toString?.()?.includes('insufficient funds') ?
        new Error(`Insufficient funds to send ${white.reset(prettyPrintCoin(this.args.amount!.coin))} from ${greenBright(from.account.name)}`) :
        error;
    }

    await this.successMessage(this.args.amount!, from.account, toAccount);
  }

  protected async logTransactionDetails(fromAccount: Account, toAccount: AccountBase): Promise<void> {
    this.log(`Sending ${prettyPrintCoin(this.args.amount!.coin)}`);
    this.log(`From ${greenBright(fromAccount.name)} (${green(fromAccount.address)})`);
    this.log(`To ${toAccount.name ? `${greenBright(toAccount.name)} (${green(toAccount.address)})` : greenBright(toAccount.address)}\n`);
  }

  protected async successMessage(amount: Amount, from: Account, to: AccountBase): Promise<void> {
    this.success(green(`Sent ${white.reset(prettyPrintCoin(amount.coin))} from ${greenBright(from.name)} to ${greenBright(to.name || to.address)}`));

    if (this.jsonEnabled())
      this.logJson({
        amount: amount.plainText,
        from: {
          name: from.name,
          address: from.address,
        },
        to: {
          name: to.name,
          address: to.address,
        },
      });
  }
}