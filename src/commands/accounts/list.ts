import { Accounts, Config } from '@/domain';
import { BaseCommand } from '@/lib/base';
import { KeyringFlags } from '@/parameters/flags';
import { yellow } from '@/utils';

/**
 * Command 'accounts list'
 * Lists all accounts in the keyring. This command cannot print the mnemonics.
 */
export default class AccountsList extends BaseCommand<typeof AccountsList> {
  static summary = 'Lists all accounts in the keyring';

  static flags = {
    ...KeyringFlags,
  };

  static examples = [
    {
      description: 'List all accounts',
      command: '<%= config.bin %> <%= command.id %>',
    },
  ];

  /**
   * Runs the command.
   *
   * @returns Empty promise
   */
  public async run(): Promise<void> {
    const config = await Config.init();
    const accountsDomain = await Accounts.initFromFlags(this.flags, config);

    if (this.jsonEnabled()) {
      const accounts = await accountsDomain.list();
      this.logJson({ accounts });
      return;
    }

    const accounts = await accountsDomain.listNameAndAddress();
    if (accounts.length === 0) {
      this.log(yellow('No accounts found'));
      return;
    }

    for (const item of accounts) {
      this.log(`${Accounts.prettyPrintNameAndAddress(item)}\n`);
    }
  }
}
