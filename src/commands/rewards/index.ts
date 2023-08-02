import { Command } from '@oclif/core';
import Help from '@/plugins/help-plugin/help';

export default class Rewards extends Command {
  static summary = 'Display help for the rewards command.';

  public async run(): Promise<void> {
    const help = new Help(this.config, { all: true });
    await help.showCommandHelp(Rewards);
  }
}
