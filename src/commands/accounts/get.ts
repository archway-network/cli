import { Flags } from '@oclif/core';

import { BaseCommand } from '@/lib/base';
import { AccountRequiredArg } from '@/arguments';
import { Accounts } from '@/domain';
import { KeyringFlags } from '@/flags';
import { SuccessMessages } from '@/services';

import { BackendType } from '@/types';

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

    SuccessMessages.accounts.get(this, account, this.flags.address);
  }
}
