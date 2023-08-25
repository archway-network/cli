import { BaseCommand } from '@/lib/base';
import { bold, greenBright } from '@/utils';
import { ChainRegistry, Config, DEFAULT_CONFIG_FILENAME } from '@/domain';
import { ChainRequiredArg } from '@/parameters/arguments';

/**
 * Command 'config chains use'
 * Switches the current chain in use and updates the config file
 */
export default class ConfigChainsUse extends BaseCommand<typeof ConfigChainsUse> {
  static summary = `Switches the current chain in use and updates the ${bold(DEFAULT_CONFIG_FILENAME)} config file with his information.`;
  static args = {
    chain: ChainRequiredArg,
  };

  /**
   * Runs the command.
   *
   * @returns Empty promise
   */
  public async run(): Promise<void> {
    const configFile = await Config.init();
    const chainRegistry = await ChainRegistry.init();

    if (chainRegistry.warnings) this.warning(chainRegistry.prettyPrintWarnings(this.args.chain));

    configFile.update({ chainId: this.args.chain }, true);

    await this.successMessage(this.args.chain!);
  }

  protected async successMessage(chainId: string): Promise<void> {
    this.success(`${greenBright('Switched chain to')} ${bold(chainId)}`);

    if (this.jsonEnabled()) this.logJson({ chainId });
  }
}
