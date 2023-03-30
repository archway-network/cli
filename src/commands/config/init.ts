import { Flags } from '@oclif/core';
import { Chain } from '../../services/Chain';
import { BaseCommand } from '../../lib/base';
import { showPrompt } from '../../actions/Prompt';
import { ChainPrompt } from '../../domain/Chain';
import { ConfigFile } from '../../domain/ConfigFile';

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

      chain = response?.chain;
    }

    const configFile = ConfigFile.init({
      name: 'test',
      chainId: chain || '',
    });

    if (await ConfigFile.exists()) {
      throw new Error('the file modulor.json already exists in this repository');
    }

    await configFile.write();

    this.log('Config file created: modulor.json');
  }
}
