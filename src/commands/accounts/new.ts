import { Flags } from '@oclif/core';

import { BaseCommand } from '@/lib/base';
import { bold, darkGreen, green, yellow } from '@/utils';
import { accountRequired } from '@/arguments';
import { Accounts } from '@/domain';
import { KeyringFlags } from '@/flags';

import { BackendType } from '@/types';

/**
 * Command 'accounts new'
 * Adds a new wallet to the keystore. It requires a name and will generate a new mnemonic (if not provided) to create the wallet's private keys.
 */
export default class AccountsNew extends BaseCommand<typeof AccountsNew> {
  static summary = 'Adds a new wallet to the keystore';
  static args = {
    account: accountRequired,
  };

  static flags = {
    mnemonic: Flags.string({ description: 'Wallet mnemonic (seed phrase)' }),
    ledger: Flags.boolean(),
    ...KeyringFlags,
  };

  /**
   * Runs the command.
   *
   * @returns Empty promise
   */
  public async run(): Promise<void> {
    const accountsDomain = await Accounts.init(this.flags['keyring-backend'] as BackendType, { filesPath: this.flags['keyring-path'] });
    const account = await accountsDomain.new(this.args.account!, this.flags.mnemonic);

    this.success(`${darkGreen('Account')} ${green(account.name)} successfully created!`);
    this.log(`\nAddress: ${green(account.address)}\n`);
    this.log(Accounts.prettyPrintPublicKey(account.publicKey));
    this.log(`\n${bold('Mnemonic:')} ${account.mnemonic}\n`);
    this.warning(
      `${yellow('Important:')} write this mnemonic phrase in a safe place. It is the ${bold(
        'only'
      )} way to recover your account if you forget your password.`
    );

    if (this.jsonEnabled()) {
      this.logJson(account);
    }
  }
}
