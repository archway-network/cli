import { BaseCommand } from '../../lib/base';
import { ConfigFile } from '../../domain/ConfigFile';
import { bold, green } from '../../utils/style';
import { DEFAULT } from '../../config';
import { chainWithPrompt } from '../../flags/chain';

export default class ConfigInit extends BaseCommand<typeof ConfigInit> {
  static summary = 'Initializes a config file for the current project.';
  static flags = {
    chain: chainWithPrompt(),
  };

  public async run(): Promise<void> {
    console.log(this.flags.chain as string)
    await ConfigFile.create(this.flags.chain as string);

    this.success(`${green('Config file')} ${bold(DEFAULT.ConfigFileName)} ${green('created')}`);
  }
}
