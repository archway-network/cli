import { Command } from '@oclif/core';

import Help from '@/plugins/help-plugin/help';

/**
 * Command 'accounts'
 * Displays the help info for the 'accounts' command
 */
export default class Accounts extends Command {
  static summary = 'Manages a local keyring with wallets to sign transactions';

  public async run(): Promise<void> {
    const help = new Help(this.config, { all: true });
    await help.showCommandHelp(Accounts);
  }
}
