import { BaseCommand } from '@/lib/base';
import { DEFAULT } from '@/config';
import { bold, green } from '@/utils/style';
import { ChainRegistry } from '@/domain/ChainRegistry';
import { Config } from '@/domain/Config';
import { chainRequired } from '@/flags/chain';

/**
 * Command 'config chains use'
 * Switches the current chain in use and updates the config file
 */
export default class ConfigChainsUse extends BaseCommand<typeof ConfigChainsUse> {
  static summary = `Switches the current chain in use and updates the ${bold(DEFAULT.ConfigFileName)} config file with his information.`;
  static flags = {
    chain: chainRequired,
  };

  /**
   * Runs the command.
   *
   * @returns Empty promise
   */
  public async run(): Promise<void> {
    const configFile = await Config.open();
    const chainRegistry = await ChainRegistry.init();

    if (chainRegistry.warnings) this.warning(chainRegistry.prettyPrintWarnings(this.flags.chain));

    configFile.update({ chainId: this.flags.chain }, true);

    this.success(`${green('Switched chain to')} ${bold(this.flags.chain)}`);
  }
}
