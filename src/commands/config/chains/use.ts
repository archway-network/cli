import { BaseCommand } from '../../../lib/base';
import { DefaultConfigFileName } from '../../../config';
import { bold, green, red } from '../../../utils/style';
import { ChainRegistry } from '../../../domain/ChainRegistry';
import { ConfigFile } from '../../../domain/ConfigFile';
import { Flags } from '@oclif/core';

export default class ConfigChainsUse extends BaseCommand<typeof ConfigChainsUse> {
  static summary = `Switches the current chain in use and updates the ${bold(DefaultConfigFileName)} config file with his information.`;
  static flags = {
    chain: Flags.string({ required: true }),
  };

  public async run(): Promise<void> {
    const configFile = await ConfigFile.open();
    const chainRegistry = await ChainRegistry.init();

    if (!chainRegistry.getChainById(this.flags.chain)) {
      throw new Error(`❌ ${red('Chain id')} ${bold(this.flags.chain)} ${red('not found')}`);
    }

    configFile.update({ chainId: this.flags.chain }, true);

    this.log(`✅ ${green('Switched chain to')} ${bold(this.flags.chain)}`);
  }
}
