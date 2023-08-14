import { BaseCommand } from '@/lib/base';
import { Config, DEFAULT_CONFIG_FILENAME } from '@/domain';
import { bold, green } from '@/utils';
import { ChainWithPromptFlag } from '@/parameters/flags';

/**
 * Command 'config init'
 * Initializes a config file for the current project
 */
export default class ConfigInit extends BaseCommand<typeof ConfigInit> {
  static summary = 'Initializes a config file for the current project.';
  static flags = {
    chain: ChainWithPromptFlag,
  };

  /**
   * Runs the command.
   *
   * @returns Empty promise
   */
  public async run(): Promise<void> {
    await Config.create(this.flags.chain!);

    await this.successMessage();
  }

  protected async successMessage(): Promise<void> {
    this.success(`${green('Config file')} ${bold(DEFAULT_CONFIG_FILENAME)} ${green('created')}`);
  }
}
