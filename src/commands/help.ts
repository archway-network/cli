import { Command } from '@oclif/core';

import Help from '@/plugins/help-plugin/help';

/**
 * Command 'help'
 * Displays the help info
 */
export default class Config extends Command {
  static summary = 'Display help for archway.';

  /**
   * Runs the command.
   *
   * @returns Empty promise
   */
  public async run(): Promise<void> {
    const help = new Help(this.config, { all: true });
    await help.showHelp(this.argv);
  }
}
