import { BaseCommand } from '@/lib/base';
import { DEFAULT } from '@/GlobalConfig';
import { bold } from '@/utils';
import { ChainRegistry, Config } from '@/domain';
import { ChainRequiredFlag } from '@/flags';
import { SuccessMessages } from '@/services';

/**
 * Command 'config chains use'
 * Switches the current chain in use and updates the config file
 */
export default class ConfigChainsUse extends BaseCommand<typeof ConfigChainsUse> {
  static summary = `Switches the current chain in use and updates the ${bold(DEFAULT.ConfigFileName)} config file with his information.`;
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

    SuccessMessages.chains.use(this, this.flags.chain!);
  }
}
