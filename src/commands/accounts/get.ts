import { Flags } from '@oclif/core';

import { BaseCommand } from '@/lib/base';
import { AccountRequiredArg } from '@/parameters/arguments';
import { Accounts } from '@/domain';
import { KeyringFlags } from '@/parameters/flags';

import { Account, BackendType } from '@/types';

/**
 * Command 'accounts get'
 * DIsplays details about an account. This command cannot print the mnemonic.
 */
export default class AccountsGet extends BaseCommand<typeof AccountsGet> {
  static summary = 'Displays details about an account';
  static args = {
    account: AccountRequiredArg,
  };

  static flags = {
    address: Flags.boolean({ description: 'Display the address only' }),
    ...KeyringFlags,
  };

  /**
   * Runs the command.
   *
   * @returns Empty promise
   */
  public async run(): Promise<void> {
    const accountsDomain = await Accounts.init(this.flags['keyring-backend'] as BackendType, { filesPath: this.flags['keyring-path'] });
    const account = await accountsDomain.get(this.args.account!);

    await this.successMessage(account, this.flags.address);
  }

  protected async successMessage(account: Account, showAddress?: boolean): Promise<void> {
    if (showAddress) {
      this.log(account.address);
      if (this.jsonEnabled()) this.logJson({ account: { address: account.address } });
    } else {
      this.log(`${Accounts.prettyPrintNameAndAddress(account)}\n\n${Accounts.prettyPrintPublicKey(account.publicKey)}`);
      if (this.jsonEnabled()) this.logJson(account);
    }
  }
}
