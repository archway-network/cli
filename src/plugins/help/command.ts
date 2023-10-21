import { Command, CommandHelp, HelpSection, HelpSectionRenderer } from '@oclif/core';
import { compact } from 'lodash';

import { dim, yellow } from '@/utils';

export default class CustomCommandHelp extends CommandHelp {
  protected args(args: Command.Arg.Any[]): Array<[string, string | undefined]> | undefined {
    if (args.filter(a => a.description).length === 0) {
      return;
    }

    return args
      .sort((a, b) => {
        if (a.required === b.required) {
          return 0;
        }

        if (a.required) {
          return 1;
        }

        return -1;
      })
      .map(a => {
        const name = a.name.toUpperCase();
        let description = a.description || '';
        if (a.default) {
          description = `[default: ${a.default}] ${description}`;
        }

        if (a.options) {
          description = `(${a.options.join('|')}) ${description}`;
        }

        if (a.required) {
          description = `(required) ${description}`;
        }

        return [name, description ? dim(description) : undefined];
      });
  }

  protected sections(): Array<{ generate: HelpSectionRenderer; header: string }> {
    return [
      {
        header: this.opts.usageHeader || yellow('Usage:'),
        generate: () => this.usage(),
      },
      {
        header: yellow('Arguments:'),
        generate: ({ args }, header) => [{ header, body: this.args(args) }],
      },
      {
        header: yellow('Flags:'),
        generate: ({ flags }, header) => {
          const { mainFlags, flagGroups } = this.groupFlags(flags);

          const flagSections: HelpSection[] = [];

          const requiredFlags: Command.Flag.Any[] = [];
          const otherFlags: Command.Flag.Any[] = [];

          for (const item of mainFlags) {
            if (item.required) {
              requiredFlags.push(item);
              continue;
            }

            otherFlags.push(item);
          }

          const requiredFlagBody = this.flags(requiredFlags);
          if (requiredFlagBody) {
            flagSections.push({ header: `${yellow('REQUIRED')} ${header}`, body: requiredFlagBody });
          }

          const mainFlagBody = this.flags(otherFlags);
          if (mainFlagBody) {
            flagSections.push({ header, body: mainFlagBody });
          }

          const sortedFlagGroups = Object.keys(flagGroups).sort((a, b) => {
            if (a === b) {
              return 0;
            }

            if (a === 'GLOBAL') {
              return 1;
            }

            return b === 'GLOBAL' ? -1 : (a > b ? 1 : -1);
          });

          for (const name of sortedFlagGroups) {
            const flags = flagGroups[name];
            const body = this.flags(flags);
            if (body) {
              flagSections.push({ header: `${yellow(name)} ${header}`, body });
            }
          }

          return compact<HelpSection>(flagSections);
        },
      },
      {
        header: yellow('Description:'),
        generate: () => this.description(),
      },
      {
        header: yellow('Aliases:'),
        generate: ({ cmd }) => this.aliases(cmd.aliases),
      },
      {
        header: yellow('Examples:'),
        generate: ({ cmd }) => {
          const examples = cmd.examples || (cmd as any).example;
          return this.examples(examples);
        },
      },
      {
        header: yellow('Flag descriptions:'),
        generate: ({ flags }) => this.flagsDescriptions(flags),
      },
    ];
  }
}
