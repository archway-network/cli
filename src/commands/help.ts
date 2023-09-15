import { BaseCommand } from '@/lib/base';
import HelpPlugin from '@/plugins/help-plugin/help';

/**
 * Command 'help'
 * Displays available commands and their descriptions for the Archway CLI
 */
export default class Help extends BaseCommand<typeof Help> {
  static summary = 'Displays available commands and their descriptions for the Archway CLI';

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
