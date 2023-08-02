import { Flags } from '@oclif/core';

import { BaseCommand } from '@/lib/base';
import { AccountRequiredArg } from '@/arguments';
import { Accounts } from '@/domain';
import { KeyringFlags } from '@/flags';
import { SuccessMessages } from '@/services';

import { BackendType } from '@/types';

/**
 * Command 'accounts new'
 * Adds a new wallet to the keystore. It requires a name and will generate a new mnemonic (if not provided) to create the wallet's private keys.
 */
export default class AccountsNew extends BaseCommand<typeof AccountsNew> {
  static summary = 'Adds a new wallet to the keystore';
  static args = {
    account: AccountRequiredArg,
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

    SuccessMessages.accounts.new(this, account);
  }
}
