import { Flags } from '@oclif/core';
import { BuiltInChains } from '../../services/BuiltInChains';
import { BaseCommand } from '../../lib/base';
import { showPrompt } from '../../ui/Prompt';
import { ChainPrompt } from '../../services/Prompts';
import { ConfigFile } from '../../domain/ConfigFile';
import { bold, green } from '../../utils/style';
import { DEFAULT } from '../../config';

export default class ConfigInit extends BaseCommand<typeof ConfigInit> {
  static summary = 'Initializes a config file for the current project.';
  static flags = {
    chain: Flags.string({ options: BuiltInChains.getChainIds() }),
  };

  public async run(): Promise<void> {
    let chainId = this.flags?.chain;

    // If chain flag is not set, prompt user
    if (!chainId) {
      const response = await showPrompt(ChainPrompt);
      chainId = response.chain as string;
    }

    await ConfigFile.create(chainId);

    this.log(`✅ ${green('Config file')} ${bold(DEFAULT.ConfigFileName)} ${green('created')}`);
  }
}
