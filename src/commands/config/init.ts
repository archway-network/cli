import { BaseCommand } from '@/lib/base';
import { Config, DEFAULT_CONFIG_PATH } from '@/domain';
import { bold, green } from '@/utils';
import { ChainOptionalFlag } from '@/parameters/flags';
import { Prompts } from '@/services';

/**
 * Command 'config init'
 * Initializes a config file for the current project
 */
export default class ConfigInit extends BaseCommand<typeof ConfigInit> {
  static summary = 'Initializes a config file for the current project.';
  static flags = {
    chain: ChainOptionalFlag,
  };

  /**
   * Runs the command.
   *
   * @returns Empty promise
   */
  public async run(): Promise<void> {
    const config = await Config.create(this.flags.chain || (await Prompts.chain()).chain);

    await this.successMessage(config);
  }

  protected async successMessage(config: Config): Promise<void> {
    this.success(`${green('Config file')} ${bold(DEFAULT_CONFIG_PATH)} ${green('created')}`);

    if (this.jsonEnabled()) this.logJson(config.toConfigData());
  }
}
