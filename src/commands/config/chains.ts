import { BaseCommand } from '../../lib/base';

export default class ConfigChains extends BaseCommand<typeof ConfigChains> {
  static summary = 'Display help for ...';

  public async run(): Promise<void> {
    this.log('commands/config/chains.ts');
  }
}
