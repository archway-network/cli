import { Command } from '@oclif/core';
import Help from '@/plugins/help-plugin/help';

export default class Accounts extends Command {
  static summary = 'Display help for the accounts command.';

  public async run(): Promise<void> {
    const help = new Help(this.config, { all: true });
    await help.showCommandHelp(Accounts);
  }
}
