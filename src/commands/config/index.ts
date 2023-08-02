import { Command } from '@oclif/core';

import Help from '@/plugins/help-plugin/help';

/**
 * Command 'config'
 * Displays the help info for the 'config' command
 */
export default class Config extends Command {
  static summary = 'Display help for the config command.';

  /**
   * Runs the command.
   *
   * @returns Empty promise
   */
  public async run(): Promise<void> {
    const help = new Help(this.config, { all: true });
    await help.showCommandHelp(Config);
  }
}
