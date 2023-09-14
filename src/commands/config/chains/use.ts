import { BaseCommand } from '@/lib/base';
import { bold, greenBright } from '@/utils';
import { ChainRegistry, Config } from '@/domain';
import { ChainRequiredArg } from '@/parameters/arguments';
import { GlobalFlag } from '@/parameters/flags';

/**
 * Command 'config chains use'
 * Switches the current chain in use and updates the config file appropriately
 */
export default class ConfigChainsUse extends BaseCommand<typeof ConfigChainsUse> {
  static summary = 'Switches the current chain in use and updates the config file appropriately';
  static args = {
    chain: ChainRequiredArg,
  };

  static flags = {
    global: GlobalFlag
  };

  static examples = [
    {
      description: 'Select a chain for the local config',
      command: '<%= config.bin %> <%= command.id %> constantine-3',
    },
    {
      description: 'Select a chain for the global config',
      command: '<%= config.bin %> <%= command.id %> constantine-3 --global',
    },
  ];

  /**
   * Runs the command.
   *
   * @returns Empty promise
   */
  public async run(): Promise<void> {
    const configFile = await Config.init();
    const chainRegistry = await ChainRegistry.init();

    if (chainRegistry.warnings) this.warning(chainRegistry.prettyPrintWarnings(this.args.chain));

    configFile.update({ 'chain-id': this.args.chain }, this.flags.global);

    await this.successMessage(this.args.chain!);
  }

  protected async successMessage(chainId: string): Promise<void> {
    this.success(`${greenBright('Switched chain to')} ${bold(chainId)}`);

    if (this.jsonEnabled()) this.logJson({ 'chain-id': chainId });
  }
}
