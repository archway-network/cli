import { BaseCommand } from '../../lib/base';

export default class ConfigNetwork extends BaseCommand<typeof ConfigNetwork> {
  static summary = 'Display help for ...';

  public async run(): Promise<void> {
    this.log('commands/config/network.ts');
  }
}
