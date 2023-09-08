import { BaseCommand } from '@/lib/base';
import HelpPlugin from '@/plugins/help-plugin/help';

/**
 * Command 'help'
 * Displays the help info
 */
export default class Help extends BaseCommand<typeof Help> {
  static summary = 'Display help for archway.';

  /**
   * Runs the command.
   *
   * @returns Empty promise
   */
  public async run(): Promise<void> {
    const help = new HelpPlugin(this.config, { all: true });
    await help.showHelp(this.argv);
  }
}
