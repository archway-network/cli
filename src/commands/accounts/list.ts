import { BaseCommand } from '@/lib/base';
import { Accounts } from '@/domain/Accounts';
import { KeyringFlags } from '@/flags/keyring';

import { BackendType } from '@/types/Account';

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

    if (this.jsonEnabled()) {
      const list = await accountsDomain.keystore.list();

      this.logJson({ accounts: list });
    } else {
      const list = await accountsDomain.keystore.listNameAndAddress();

      for (const item of list) {
        this.log(`${Accounts.prettyPrintNameAndAddress(item)}\n`);
      }
    }
  }
}
