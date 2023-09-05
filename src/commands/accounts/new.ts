import { Args, Flags } from '@oclif/core';

import { BaseCommand } from '@/lib/base';
import { ParamsAccountOptionalArg, StdinInputArg } from '@/parameters/arguments';
import { Accounts, Config } from '@/domain';
import { HdPathOptionalFlag, KeyringFlags } from '@/parameters/flags';
import { bold, green, greenBright, yellow } from '@/utils';
import { Prompts } from '@/services';

import { Account, AccountType } from '@/types';

/**
 * Command 'accounts new'
 * Adds a new wallet to the keystore. It requires a name and will generate a new mnemonic (if not provided) to create the wallet's private keys.
 */
export default class AccountsNew extends BaseCommand<typeof AccountsNew> {
  static summary = 'Adds a new wallet to the keystore';
  static args = {
    'account-name': Args.string({ ...ParamsAccountOptionalArg, ignoreStdin: true }),
    stdinInput: StdinInputArg,
  };

  static flags = {
    ledger: Flags.boolean({ description: 'Add an account from a ledger device' }),
    recover: Flags.boolean({
      description:
        'Enables the recovery of an account from a mnemonic or a private key, received via the stdin, for example: cat ./key.txt | archway accounts new --recover',
    }),
    'hd-path': HdPathOptionalFlag,
    ...KeyringFlags,
  };

  /**
   * Runs the command.
   *
   * @returns Empty promise
   */
  public async run(): Promise<void> {
    const type = this.flags.ledger ? AccountType.LEDGER : AccountType.LOCAL;

    const config = await Config.init();
    const accountsDomain = await Accounts.initFromFlags(this.flags, config);

    const account = await accountsDomain.new(
      this.args['account-name'] || (await Prompts.newAccount()),
      type,
      this.flags.recover ? this.args.stdinInput : undefined,
      this.flags['hd-path']
    );

    await this.successMessage(account);
  }

  protected async successMessage(account: Account): Promise<void> {
    if (this.jsonEnabled()) {
      this.logJson(account);
    } else {
      this.success(`${green('Account')} ${greenBright(account.name)} successfully created!`);
      this.log(`\nAddress: ${greenBright(account.address)}\n`);
      this.log(Accounts.prettyPrintPublicKey(account.publicKey));
      if (account.type === AccountType.LOCAL && account.mnemonic) {
        this.log(`\n${bold('Mnemonic:')} ${account.mnemonic}\n`);
        this.warning(
          `${yellow('Important:')} write this mnemonic phrase in a safe place. It is the ${bold(
            'only'
          )} way to recover your account if you forget your password.`
        );
      }

      if (account.type === AccountType.LEDGER) {
        this.log();
        this.warning(yellow('Ledger account'));
      }
    }
  }
}
