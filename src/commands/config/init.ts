import { Config, LOCAL_CONFIG_FILE } from '@/domain';
import { BaseCommand } from '@/lib/base';
import { ChainOptionalFlag } from '@/parameters/flags';
import { Prompts } from '@/services';
import { bold, green } from '@/utils';

/**
 * Command 'config init'
 * Initializes a config file for the current project
 */
export default class ConfigInit extends BaseCommand<typeof ConfigInit> {
  static summary = 'Initializes a config file for the current project';
  static flags = {
    chain: ChainOptionalFlag,
  };

  static examples = [
    {
      description: 'Initialize a config file',
      command: '<%= config.bin %> <%= command.id %>',
    },
    {
      description: 'Initialize a config file with a chain id',
      command: '<%= config.bin %> <%= command.id %> --chain="constantine-3"',
    },
  ];

  /**
   * Runs the command.
   *
   * @returns Empty promise
   */
  public async run(): Promise<void> {
    const config = await Config.create(this.flags.chain || (await Prompts.chain()));

    await this.successMessage(config);
  }

  protected async successMessage(config: Config): Promise<void> {
    this.success(`${green('Config file')} ${bold(LOCAL_CONFIG_FILE)} ${green('created')}`);

    if (this.jsonEnabled()) {
      this.logJson(config.localData);
    }
  }
}
