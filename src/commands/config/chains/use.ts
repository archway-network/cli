import { BaseCommand } from '@/lib/base';
import { bold, green } from '@/utils';
import { ChainRegistry, Config, DEFAULT_CONFIG_FILENAME } from '@/domain';
import { ChainRequiredFlag } from '@/parameters/flags';

/**
 * Command 'config chains use'
 * Switches the current chain in use and updates the config file
 */
export default class ConfigChainsUse extends BaseCommand<typeof ConfigChainsUse> {
  static summary = `Switches the current chain in use and updates the ${bold(DEFAULT_CONFIG_FILENAME)} config file with his information.`;
  static flags = {
    chain: ChainRequiredFlag,
  };

  /**
   * Runs the command.
   *
   * @returns Empty promise
   */
  public async run(): Promise<void> {
    const configFile = await Config.init();
    const chainRegistry = await ChainRegistry.init();

    if (chainRegistry.warnings) this.warning(chainRegistry.prettyPrintWarnings(this.flags.chain));

    configFile.update({ chainId: this.flags.chain }, true);

    await this.successMessage(this.flags.chain!);
  }

  protected async successMessage(chainId: string): Promise<void> {
    this.success(`${green('Switched chain to')} ${bold(chainId)}`);
  }
}
