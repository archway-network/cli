import { Command } from '@oclif/core';

import Help from '@/plugins/help-plugin/help';

/**
 * Command 'accounts balances'
 * Displays the help info for the 'accounts balances' command
 */
export default class AccountsBalances extends Command {
  static summary = 'Manage the balances of an account.';

  public async run(): Promise<void> {
    const help = new Help(this.config, { all: true });
    await help.showCommandHelp(AccountsBalances);
  }
}
