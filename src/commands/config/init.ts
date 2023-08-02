import { BaseCommand } from '@/lib/base';
import { Config } from '@/domain';
import { bold, green } from '@/utils';
import { DEFAULT } from '@/GlobalConfig';
import { chainWithPrompt } from '@/flags';

/**
 * Command 'config init'
 * Initializes a config file for the current project
 */
export default class ConfigInit extends BaseCommand<typeof ConfigInit> {
  static summary = 'Initializes a config file for the current project.';
  static flags = {
    chain: chainWithPrompt,
  };

  /**
   * Runs the command.
   *
   * @returns Empty promise
   */
  public async run(): Promise<void> {
    await Config.create(this.flags.chain!);

    this.success(`${green('Config file')} ${bold(DEFAULT.ConfigFileName)} ${green('created')}`);
  }
}
