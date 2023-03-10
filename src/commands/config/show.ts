import { BaseCommand } from '../../lib/base';

export default class ConfigShow extends BaseCommand<typeof ConfigShow> {
  static summary = 'Shows the config file for the current project.';

  public async run(): Promise<void> {
    this.log('commands/config/show.ts');
  }
}
