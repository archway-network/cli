import { BaseCommand } from '@/lib/base';
import { Config } from '@/domain';

/**
 * Command 'config show'
 * Displays the config values for the current project
 */
export default class ConfigShow extends BaseCommand<typeof ConfigShow> {
  static summary = 'Displays the config values for the current project';

  static examples = [
    {
      description: 'Display the config for the current project',
      command: '<%= config.bin %> <%= command.id %>'
    },
  ];

  /**
   * Runs the command.
   *
   * @returns Empty promise
   */
  public async run(): Promise<void> {
    const configFile = await Config.init();

    await this.successMessage(configFile);
  }

  protected async successMessage(configFile: Config): Promise<void> {
    this.log(await configFile.prettyPrint());

    if (this.jsonEnabled()) {
      this.logJson(await configFile.dataWithContracts());
    }
  }
}
