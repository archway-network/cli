import { BaseCommand } from '@/lib/base';
import { ConfigFile } from '@/domain/ConfigFile';

/**
 * Command 'config show'
 * Shows the config file for the current project.
 */
export default class ConfigShow extends BaseCommand<typeof ConfigShow> {
  static summary = 'Shows the config file for the current project.';

  /**
   * Runs the command.
   *
   * @returns Empty promise
   */
  public async run(): Promise<void> {
    const configFile = await ConfigFile.open();

    this.log(await configFile.prettyPrint());

    if (this.jsonEnabled()) {
      this.logJson(await configFile.dataWithContracts());
    }
  }
}
