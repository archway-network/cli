import { CommandHelp, HelpSection, HelpSectionRenderer } from '@oclif/core';
import { compact } from 'lodash';

import { yellow } from '@/utils';

export default class CustomCommandHelp extends CommandHelp {
  protected sections(): Array<{ header: string; generate: HelpSectionRenderer }> {
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
          const mainFlagBody = this.flags(mainFlags);

          if (mainFlagBody) flagSections.push({ header, body: mainFlagBody });

          for (const [name, flags] of Object.entries(flagGroups)) {
            const body = this.flags(flags);
            if (body) flagSections.push({ header: `${yellow(name)} ${header}`, body });
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
