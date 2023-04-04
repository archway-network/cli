import { Flags } from '@oclif/core';
import { BuiltInChains } from '../../services/BuiltInChains';
import { BaseCommand } from '../../lib/base';
import { showPrompt } from '../../actions/Prompt';
import { ChainPrompt } from '../../services/Prompts';
import { ConfigFile } from '../../domain/ConfigFile';
import { bold, green, red } from '../../utils/style';
import { DEFAULT } from '../../config';
import path from 'node:path';
import { getWokspaceRoot } from '../../utils/paths';

export default class ConfigInit extends BaseCommand<typeof ConfigInit> {
  static summary = 'Initializes a config file for the current project.';
  static flags = {
    chain: Flags.string({ options: BuiltInChains.getChainIds() }),
  };

  public async run(): Promise<void> {
    // Get flags
    const { flags } = await this.parse(ConfigInit);
    let chain = flags.chain;

    if (await ConfigFile.exists()) {
      this.error(`❌ ${red('The file')} ${bold(DEFAULT.ConfigFileName)} ${red('already exists in this repository')}`);
    }

    // If chain flag is not set, prompt user
    if (!chain) {
      const response = await showPrompt(ChainPrompt);
      chain = response.chain as string;
    }

    // Get Workspace root
    const workingDir = await getWokspaceRoot();
    // Get name of Workspace root directory
    const name = path.basename(workingDir);

    // Create config file
    const configFile = await ConfigFile.init({
      name,
      chainId: chain,
    });
    await configFile.write();

    this.log(`✅ ${green('Config file')} ${bold(DEFAULT.ConfigFileName)} ${green('created')}`);
  }
}
