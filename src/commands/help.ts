// import { BaseCommand } from '@/lib/base';
// import HelpPlugin from '@/plugins/help-plugin/help';

// /**
//  * Command 'help'
//  * Displays available commands and their descriptions for the Archway CLI
//  */
// export default class Help extends BaseCommand<typeof Help> {
//   static summary = 'Displays available commands and their descriptions for the Archway CLI';

//   /**
//    * Runs the command.
//    *
//    * @returns Empty promise
//    */
//   public async run(): Promise<void> {
//     const help = new HelpPlugin(this.config, { all: true });
//     await help.showHelp(this.argv);
//   }
// }

import { BaseCommand } from '@/lib/base';
import Help from '@/plugins/help-plugin/help';
import {Args, Flags} from '@oclif/core'

export default class HelpCommand extends BaseCommand<typeof HelpCommand> {
  static description = 'Display help for <%= config.bin %>.'

  static flags = {
    'nested-commands': Flags.boolean({
      description: 'Include all nested commands in the output.',
      char: 'n',
    }),
  }

  static args = {
    commands: Args.string({required: false, description: 'Command to show help for.'}),
  }

  static strict = false

  async run(): Promise<void> {
    const {flags, argv} = await this.parse(HelpCommand)
    const help = new Help(this.config, {all: flags['nested-commands']})
    await help.showHelp(argv as string[])
  }
}
