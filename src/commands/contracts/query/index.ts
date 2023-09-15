import { Command } from '@oclif/core';

import Help from '@/plugins/help-plugin/help';

export default class ContractsQuery extends Command {
  static summary = 'Display help for the contracts query command';

  public async run(): Promise<void> {
    const help = new Help(this.config, { all: true });
    await help.showCommandHelp(ContractsQuery);
  }
}
