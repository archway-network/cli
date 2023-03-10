import { BaseCommand } from '../../lib/base';

export default class ConfigInit extends BaseCommand<typeof ConfigInit> {
  static summary = 'Initializes a config file for the current project.';

  public async run(): Promise<void> {
    this.log('commands/config/init.ts');
  }
}
