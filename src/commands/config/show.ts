import { BaseCommand } from '../../lib/base';
import { ConfigFile } from '../../domain/ConfigFile';

export default class ConfigShow extends BaseCommand<typeof ConfigShow> {
  static summary = 'Shows the config file for the current project.';

  public async run(): Promise<void> {
    const configFile = await ConfigFile.open();

    this.log(await configFile.prettyPrint());

    if (this.jsonEnabled()) {
      this.logJson(await configFile.dataWithContracts());
    }
  }
}
