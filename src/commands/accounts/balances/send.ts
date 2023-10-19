import { Flags } from '@oclif/core';

import { Accounts, Config } from '@/domain';
import { BaseCommand } from '@/lib/base';
import { AmountRequiredArg } from '@/parameters/arguments';
import { KeyringFlags, TransactionFlags } from '@/parameters/flags';
import { Prompts } from '@/services';
import { AccountBase } from '@/types';
import { showDisappearingSpinner } from '@/ui';
import { buildStdFee, green, greenBright, prettyPrintCoin, white } from '@/utils';

export interface SendResult {
  amount: string;
  from: {
    name: string;
    address: string;
  };
  to: {
    name: string;
    address: string;
  };
}

/**
 * Command 'accounts balances send'
 * This command will use the bank module to send coins from one account to another.
 */
export default class AccountsBalancesSend extends BaseCommand<typeof AccountsBalancesSend> {
  static summary = 'Send tokens from one address or account to another';
  static args = {
    amount: AmountRequiredArg,
  };

  static flags = {
    to: Flags.string({ description: 'Destination of the funds', required: true }),
    ...KeyringFlags,
    ...TransactionFlags,
  };

  static examples = [
    {
      description: 'Send tokens to an address',
      command: '<%= config.bin %> <%= command.id %> 1aconst --to "archway1dstndnaelj95ksruudc2ww4s9epn8m59xft7jz"',
    },
    {
      description: 'Transfger tokens between accounts in the keyring',
      command: '<%= config.bin %> <%= command.id %> 1aconst --from alice --to bob',
    },
  ];

  /**
   * Runs the command.
   *
   * @returns Promise containing the completed transaction details
   */
  public async run(): Promise<SendResult> {
    const config = await Config.init();
    const accountsDomain = await Accounts.initFromFlags(this.flags, config);

    const from = await accountsDomain.getWithSigner(this.flags.from, config.defaultAccount);
    const fromAccount = from.account;
    const toAccount: AccountBase = await accountsDomain.accountBaseFromAddress(this.flags.to);

    this.log(`Sending ${prettyPrintCoin(this.args.amount!.coin)}`);
    this.log(`From ${greenBright(fromAccount.name)} (${green(fromAccount.address)})`);
    this.log(`To ${toAccount.name ? `${greenBright(toAccount.name)} (${green(toAccount.address)})` : greenBright(toAccount.address)}\n`);

    await Prompts.askForConfirmation(this.flags['no-confirm']);

    this.log();

    try {
      await showDisappearingSpinner(async () => {
        const signingClient = await config.getSigningArchwayClient(from, this.flags['gas-adjustment']);
        await signingClient.sendTokens(
          fromAccount.address,
          toAccount.address,
          [this.args.amount!.coin],
          buildStdFee(this.flags.fee?.coin)
        );
      }, 'Sending tokens');
    } catch (error: Error | any) {
      throw error?.message?.toString?.()?.includes('insufficient funds') ?
        new Error(`Insufficient funds to send ${white.reset(prettyPrintCoin(this.args.amount!.coin))} from ${greenBright(fromAccount.name)}`) :
        error;
    }

    this.success(
      green(
        `Sent ${white.reset(prettyPrintCoin(this.args.amount!.coin))} from ${greenBright(fromAccount.name)} to ${greenBright(
          toAccount.name || toAccount.address
        )}`
      )
    );

    return {
      amount: this.args.amount!.plainText,
      from: {
        name: fromAccount.name,
        address: fromAccount.address,
      },
      to: {
        name: toAccount.name,
        address: toAccount.address,
      },
    };
  }
}
