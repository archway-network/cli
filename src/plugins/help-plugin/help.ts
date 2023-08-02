import { Command, Help as BaseHelp } from '@oclif/core';
import RootHelp from './root';
import { brand, yellow } from '@/utils/style';

export default class Help extends BaseHelp {
  protected async showRootHelp(): Promise<void> {
    const commands = this.sortedCommands.filter(({ id }) => id);

    const state = this.config.pjson?.oclif?.state;
    if (state) {
      this.log(state === 'deprecated' ? `${this.config.bin} is deprecated` : `${this.config.bin} is in ${state}.\n`);
    }

    const rootHelp = new RootHelp(this.config, this.opts);
    rootHelp.showHelp();

    if (commands.length > 0) {
      this.log(this.formatCommands(commands));
      this.log('');
    }
  }

  public async showCommandHelp(command: Command.Class | Command.Loadable | Command.Cached): Promise<void> {
    const name = command.id;
    const depth = name.split(':').length;

    const subTopics = this.sortedTopics.filter(t => t.name.startsWith(name + ':') && t.name.split(':').length === depth + 1);
    const subCommands = this.sortedCommands.filter(c => c.id.startsWith(name + ':') && c.id.split(':').length === depth + 1);
    // const plugin = this.config.plugins.find(p => p.name === command.pluginName);

    // const state = this.config.pjson?.oclif?.state || plugin?.pjson?.oclif?.state || command.state;

    // if (state) {
    //   this.log(
    //     state === 'deprecated'
    //       ? `${formatCommandDeprecationWarning(toConfiguredId(name, this.config), command.deprecationOptions)}`
    //       : `This command is in ${state}.\n`
    //   );
    // }

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

  // public async showCommandHelp(command: Command.Class | Command.Loadable | Command.Cached): Promise<void> {
  //   const name = command.id;
  //   const depth = name.split(':').length;

  //   // const subTopics = this.sortedTopics.filter(t => t.name.startsWith(name + ':') && t.name.split(':').length === depth + 1);
  //   const subCommands = this.sortedCommands.filter(c => c.id.startsWith(name + ':') && c.id.split(':').length === depth + 1);
  //   // const plugin = this.config.plugins.find(p => p.name === command.pluginName);

  //   // const state = this.config.pjson?.oclif?.state || plugin?.pjson?.oclif?.state || command.state;

  //   // if (state) {
  //   //   this.log(
  //   //     state === 'deprecated'
  //   //       ? `${formatCommandDeprecationWarning(toConfiguredId(name, this.config), command.deprecationOptions)}`
  //   //       : `This command is in ${state}.\n`
  //   //   );
  //   // }

  //   const summary = this.summary(command);
  //   if (summary) {
  //     this.log(summary + '\n');
  //   }

  //   this.log(this.formatCommand(command));
  //   this.log('');

  //   // if (subTopics.length > 0) {
  //   //   this.log(this.formatTopics(subTopics));
  //   //   this.log('');
  //   // }

  //   if (subCommands.length > 0) {
  //     const aliases: string[] = [];
  //     const uniqueSubCommands: Command.Loadable[] = subCommands.filter(p => {
  //       aliases.push(...p.aliases);
  //       return !aliases.includes(p.id);
  //     });
  //     this.log(this.formatCommands(uniqueSubCommands));
  //     this.log('');
  //   }
  // }

  protected formatCommands(commands: Array<Command.Class | Command.Loadable | Command.Cached>): string {
    if (commands.length === 0) return '';

    // const singleCommands = this.renderList(
    //   commands.filter(({ id }) => !id.includes(this.config.topicSeparator)).map(c => [brand(c.id), this.summary(c)]),
    //   {
    //     spacer: '\n',
    //     stripAnsi: this.opts.stripAnsi,
    //     indentation: 2,
    //   }
    // );

    const body = this.renderList(
      commands.map(c => {
        if (this.config.topicSeparator !== ':') c.id = c.id.replace(/:/g, this.config.topicSeparator);
        return [brand(c.id), this.summary(c)];
      }),
      {
        spacer: '\n',
        stripAnsi: this.opts.stripAnsi,
        indentation: 2,
      }
    );

    return this.section(yellow('Available commands:'), body);
  }

  // protected formatCommand(command: Command.Class | Command.Loadable | Command.Cached): string {
  //   if (this.config.topicSeparator !== ':') {
  //     command.id = command.id.replace(/:/g, this.config.topicSeparator);
  //     command.aliases = command.aliases && command.aliases.map(a => a.replace(/:/g, this.config.topicSeparator));
  //   }

  //   const commandHelp = new CommandHelp(command, this.config, this.opts);
  //   return commandHelp.show();
  // }
}
