import { Flags } from '@oclif/core';
import { Chain } from '../../services/Chain';
import { BaseCommand } from '../../lib/base';
import { showPrompt } from '../../actions/Prompt';
import { ChainPrompt } from '../../domain/Chain';

export default class ConfigInit extends BaseCommand<typeof ConfigInit> {
  static summary = 'Initializes a config file for the current project.';
  static flags = {
    chain: Flags.string({ options: Chain.getChainIds() }),
  };

  public async run(): Promise<void> {
    // Get flags
    const { flags } = await this.parse(ConfigInit);
    let chain = flags.chain;

    // If chain flag is not set, prompt user input in list
    if (!chain) {
      const response = await showPrompt(ChainPrompt);

      chain = response.chain;
    }

    this.log('commands/config/init.ts', chain);
  }
}
