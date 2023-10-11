import { BaseCommand } from '@/lib/base';
import { Args } from '@oclif/core';

import Help from '@/plugins/help-plugin/help';

/**
 * Command 'help'
 * Displays available commands and their descriptions for the Archway CLI
 */
export default class HelpCommand extends BaseCommand<typeof HelpCommand> {
  static description = 'Display help for <%= config.bin %>.';

  static args = {
    commands: Args.string({ required: false, description: 'Command to show help for.' }),
  };

  static strict = false;

  async run(): Promise<void> {
    const { argv } = await this.parse(HelpCommand);
    const help = new Help(this.config);
    await help.showHelp(argv as string[]);
  }
}
