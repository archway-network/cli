import { Command, HelpBase, Interfaces, ux } from '@oclif/core';

import { yellow } from '@/utils';

function toArray<T>(input?: T | T[]): T[] {
  if (input === undefined) return [];
  return Array.isArray(input) ? input : [input];
}

export default class CommandHelp extends HelpBase {
  constructor(
    public command: Command.Class | Command.Loadable | Command.Cached,
    public config: Interfaces.Config,
    public opts: Interfaces.HelpOptions
  ) {
    super(config, opts);
  }

  public show(): string {
    return [this.usage(), this.arguments(), this.flags(), this.examples()].join('\n\n');
  }

  protected usage(): string {
    const args = Object.values(this.command.args ?? {})
      ?.filter(a => !a.hidden)
      .map(a => this.arg(a));

    const defaultUsage = toArray([this.command.id, args.join(' ')].join(' '));

    const usage = (this.command.usage ? toArray(this.command.usage) : defaultUsage)
      .map(u => {
        const allowedSpacing = this.opts.maxWidth - this.indentSpacing;
        const line = `$ ${this.config.bin} ${u}`.trim();
        if (line.length > allowedSpacing) {
          const splitIndex = line.slice(0, Math.max(0, allowedSpacing)).lastIndexOf(' ');
          return (
            line.slice(0, Math.max(0, splitIndex)) +
            '\n' +
            this.indent(this.wrap(line.slice(Math.max(0, splitIndex)), this.indentSpacing * 2))
          );
        }

        return this.wrap(line);
      })
      .join('\n');

    return this.section(yellow('Usage:'), usage);
  }

  protected arguments(): string {
    // if (this.command.args.filter(a => a.description).length === 0) return '';

    // return args.map(a => {
    //   const name = a.name.toUpperCase();
    //   let description = a.description || '';
    //   if (a.default) description = `[default: ${a.default}] ${description}`;
    //   if (a.options) description = `(${a.options.join('|')}) ${description}`;
    //   return [name, description ? dim(description) : undefined];
    // });

    return this.section(yellow('Arguments:'), '');
  }

  protected flags(): string {
    return this.section(yellow('Flags:'), '');
  }

  protected examples(): string {
    return this.section(yellow('Examples:'), '');
  }

  protected arg(arg: Command.Arg.Any): string {
    const name = arg.name.toUpperCase();
    if (arg.required) return `${name}`;
    return `[${name}]`;
  }

  public async showHelp(): Promise<void> {
    // will not implement
  }

  public async showCommandHelp(): Promise<void> {
    // will not implement
  }

  protected log(...args: string[]): void {
    ux.log(args.join('\n') + '\n');
  }
}
