import { Command, Help as BaseHelp, Interfaces, CommandHelp } from '@oclif/core';

import RootHelp from './root';
import { blueBright, green, yellow } from '@/utils';
import CustomCommandHelp from './command';

const preferredOrder: Record<string, string[]> = {
  NO_TOPIC: ['new'],
  accounts: ['accounts:new', 'accounts:get', 'accounts:list', 'accounts:remove', 'accounts:balances:get', 'accounts:balances:send'],
  config: ['config:init', 'config:show', 'config:deployments', 'config:chains:use', 'config:chains:export', 'config:chains:import'],
  contracts: [
    'contracts:new',
    'contracts:build',
    'contracts:store',
    'contracts:instantiate',
    'contracts:metadata',
    'contracts:premium',
    'contracts:execute',
    'contracts:migrate',
    'contracts:query:balance',
    'contracts:query:smart',
  ],
  rewards: ['rewards:query', 'rewards:withdraw'],
};

interface TopicWithCommands {
  name?: string;
  description?: string;
  commands: Command.Loadable[];
}

export default class Help extends BaseHelp {
  protected async showRootHelp(): Promise<void> {
    const state = this.config.pjson?.oclif?.state;

    if (state) {
      this.log(state === 'deprecated' ? `${this.config.bin} is deprecated` : `${this.config.bin} is in ${state}.\n`);
    }

    const rootHelp = new RootHelp(this.config, this.opts);
    rootHelp.showHelp();

    const validCommands = this.sortedCommands.filter(({ id }) => id);
    const rootTopics = this.sortedTopics.filter(item => item.name.split(':').length === 1);
    const mapTopicCommands: Record<string, Record<string, Command.Loadable>> = {
      NO_TOPIC: {},
    };

    for (const auxTopic of rootTopics) mapTopicCommands[auxTopic.name] = {};

    for (const auxCommand of validCommands) {
      const name = auxCommand.id;
      const split = name.split(':');
      const depth = split.length;
      const topic = split[0];

      if (depth === 1) {
        if (rootTopics.some(item => item.name === name)) {
          continue;
        } else {
          mapTopicCommands.NO_TOPIC[name] = auxCommand;
        }
      } else {
        mapTopicCommands[topic][name] = auxCommand;
      }
    }

    const result: TopicWithCommands[] = [];
    let maxIdLength = 0;
    for (const auxTopicName of Object.keys(preferredOrder)) {
      const resultCommands: Command.Loadable[] = [];

      for (const auxCommandId of preferredOrder[auxTopicName]) {
        const foundCommand = mapTopicCommands[auxTopicName][auxCommandId];

        if (foundCommand) {
          foundCommand && resultCommands.push(foundCommand);
          maxIdLength = Math.max(maxIdLength, foundCommand.id.length);
          delete mapTopicCommands[auxTopicName][auxCommandId];
        }
      }

      for (const leftoverCommand of Object.values(mapTopicCommands[auxTopicName])) resultCommands.push(leftoverCommand);

      const topicInfo = rootTopics.find(item => item.name === auxTopicName);

      result.push({
        name: topicInfo?.name,
        description: topicInfo?.description,
        commands: resultCommands,
      });
    }

    for (const topic of result) {
      const body = this.renderList(
        topic.commands.map(c => {
          if (this.config.topicSeparator !== ':') c.id = c.id.replace(/:/g, this.config.topicSeparator);
          return [green(c.id.padEnd(maxIdLength, ' ')), this.summary(c)];
        }),
        {
          spacer: '\n',
          stripAnsi: this.opts.stripAnsi,
          indentation: 5,
        }
      );

      this.log(this.section(yellow(topic.name || 'Available commands:'), body));
    }

    this.log('');
  }

  protected formatTopics(topics: Interfaces.Topic[]): string {
    if (topics.length === 0) return '';
    const body = this.renderList(
      topics.map(c => {
        if (this.config.topicSeparator !== ':') c.name = c.name.replace(/:/g, this.config.topicSeparator);
        return [blueBright(c.name), c.description && this.render(c.description.split('\n')[0])];
      }),
      {
        spacer: '\n',
        stripAnsi: this.opts.stripAnsi,
        indentation: 2,
      }
    );
    return this.section(yellow('Subcommands:'), body);
  }

  protected getCommandHelpClass(command: Command.Class | Command.Loadable | Command.Cached): CommandHelp {
    return new CustomCommandHelp(command, this.config, this.opts);
  }

  public async showCommandHelp(command: Command.Class | Command.Loadable | Command.Cached): Promise<void> {
    const name = command.id;
    const depth = name.split(':').length;

    const subTopics = this.sortedTopics.filter(t => t.name.startsWith(name + ':') && t.name.split(':').length === depth + 1);
    const subCommands = this.sortedCommands.filter(c => c.id.startsWith(name + ':') && c.id.split(':').length === depth + 1);

    const summary = this.summary(command);
    if (summary) {
      this.log(this.section(yellow('Description:'), summary));
      this.log('');
    }

    this.log(this.formatCommand(command));
    this.log('');

    if (subTopics.length > 0) {
      this.log(this.formatTopics(subTopics));
      this.log('');
    }

    if (subCommands.length > 0) {
      const aliases: string[] = [];
      const uniqueSubCommands: Command.Loadable[] = subCommands.filter(p => {
        aliases.push(...p.aliases);
        return !aliases.includes(p.id);
      });
      this.log(this.formatCommands(uniqueSubCommands));
      this.log('');
    }
  }

  protected formatCommands(commands: Array<Command.Class | Command.Loadable | Command.Cached>): string {
    const filteredCommands = commands.filter(item => !this.sortedTopics.some(topic => topic.name === item.id));

    if (filteredCommands.length === 0) return '';
    const body = this.renderList(
      filteredCommands.map(c => {
        if (this.config.topicSeparator !== ':') c.id = c.id.replace(/:/g, this.config.topicSeparator);
        return [green(c.id), this.summary(c)];
      }),
      {
        spacer: '\n',
        stripAnsi: this.opts.stripAnsi,
        indentation: 2,
      }
    );

    return this.section(yellow('Available commands:'), body);
  }
}
