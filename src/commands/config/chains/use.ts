import { BaseCommand } from '../../../lib/base';
import { DEFAULT } from '../../../config';
import { bold, green } from '../../../utils/style';
import { ChainRegistry } from '../../../domain/ChainRegistry';
import { ConfigFile } from '../../../domain/ConfigFile';
import { chainRequired } from '../../../flags/chain';

export default class ConfigChainsUse extends BaseCommand<typeof ConfigChainsUse> {
  static summary = `Switches the current chain in use and updates the ${bold(DEFAULT.ConfigFileName)} config file with his information.`;
  static flags = {
    chain: chainRequired(),
  };

  public async run(): Promise<void> {
    const configFile = await ConfigFile.open();
    const chainRegistry = await ChainRegistry.init();

    if (chainRegistry.warnings) this.warning(chainRegistry.prettyPrintWarnings(this.flags.chain));

    configFile.update({ chainId: this.flags.chain }, true);

    this.success(`${green('Switched chain to')} ${bold(this.flags.chain)}`);
  }
}
