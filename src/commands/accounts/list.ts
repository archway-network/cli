import { BaseCommand } from '@/lib/base';
import { Accounts } from '@/domain';
import { KeyringFlags } from '@/flags';

import { BackendType } from '@/types';
import { SuccessMessages } from '@/services';

/**
 * Command 'accounts list'
 * Lists all accounts in the keyring. This command cannot print the mnemonics.
 */
export default class AccountsList extends BaseCommand<typeof AccountsList> {
  static summary = 'Lists all accounts in the keyring';

  static flags = {
    ...KeyringFlags,
  };

  /**
   * Runs the command.
   *
   * @returns Empty promise
   */
  public async run(): Promise<void> {
    const accountsDomain = await Accounts.init(this.flags['keyring-backend'] as BackendType, { filesPath: this.flags['keyring-path'] });

    await SuccessMessages.accounts.list(this, accountsDomain);
  }
}
