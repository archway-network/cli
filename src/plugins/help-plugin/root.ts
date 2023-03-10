import { HelpBase, ux } from '@oclif/core';
import { brand, yellow } from '../../utils/style';

export default class RootHelp extends HelpBase {
  public async showHelp(): Promise<void> {
    this.log(this.version());
    this.log(this.description());
    this.log(this.usage());
  }

  protected version(): string {
    return brand(this.wrap(this.config.userAgent));
  }

  protected description(): string {
    return this.section(yellow('Description:'), this.render(this.config.pjson.oclif.description || this.config.pjson.description || ''));
  }

  protected usage(): string {
    return this.section(yellow('Usage:'), this.wrap(`$ ${this.config.bin} [COMMAND]`));
  }

  protected log(...args: string[]): void {
    ux.log(args.join('\n') + '\n');
  }

  public async showCommandHelp(): Promise<void> {
    // will not implement
  }
}
