import { Command } from '@oclif/core';

import Help from '@/plugins/help-plugin/help';

export default class Contracts extends Command {
  static summary = 'Display help for the contracts command';

  public async run(): Promise<void> {
    const help = new Help(this.config, { all: true });
    await help.showCommandHelp(Contracts);
  }
}
