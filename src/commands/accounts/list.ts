import { BaseCommand } from '@/lib/base';
import { Accounts } from '@/domain';
import { KeyringFlags } from '@/parameters/flags';
import { yellow } from '@/utils';

import { BackendType } from '@/types';

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

    await this.successMessage(accountsDomain);
  }

  protected async successMessage(accountsDomain: Accounts): Promise<void> {
    if (this.jsonEnabled()) {
      const list = await accountsDomain.list();

      this.logJson({ accounts: list });
    } else {
      const list = await accountsDomain.listNameAndAddress();

      for (const item of list) {
        this.log(`${Accounts.prettyPrintNameAndAddress(item)}\n`);
      }

      if (list.length === 0) this.log(yellow('No accounts found'));
    }
  }
}
