import { Command } from '@oclif/core';
import Help from '../../plugins/help-plugin/help';

export default class Config extends Command {
  static summary = 'Display help for the config command.';

  public async run(): Promise<void> {
    const help = new Help(this.config, { all: true });
    await help.showCommandHelp(Config);
  }
}
