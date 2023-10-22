import { Config } from '@/domain';
import { BaseCommand } from '@/lib/base';
import { ConfigDataWithContracts } from '@/types';

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
   * @returns Promise with a {@link ConfigDataWithContracts}
   */
  public async run(): Promise<ConfigDataWithContracts> {
    const configFile = await Config.init();

    this.log(configFile.prettyPrint());

    return configFile.dataWithContracts;
  }
}
