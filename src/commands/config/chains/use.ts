import { Config } from '@/domain';
import { BaseCommand } from '@/lib/base';
import { CustomArgs } from '@/parameters/arguments';
import { GlobalFlag } from '@/parameters/flags';
import { ConfigData } from '@/types';
import { bold, greenBright } from '@/utils';

/**
 * Command 'config chains use'
 * Switches the current chain in use and updates the config file appropriately
 */
export default class ConfigChainsUse extends BaseCommand<typeof ConfigChainsUse> {
  static summary = 'Switches the current chain in use and updates the config file appropriately';
  static args = {
    chain: CustomArgs.chainId({ required: true }),
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
   * @returns Promise with a partial {@link ConfigData}
   */
  public async run(): Promise<Partial<ConfigData>> {
    const config = await Config.init();
    const { chainRegistry } = config;

    if (chainRegistry.warnings) {
      this.warning(chainRegistry.prettyPrintWarnings(this.args.chain));
    }

    const chainId = this.args.chain;
    const partialConfig = { 'chain-id': chainId };

    await config.update(partialConfig, this.flags.global);

    this.success(`${greenBright('Switched chain to')} ${bold(chainId)}`);

    return partialConfig;
  }
}
