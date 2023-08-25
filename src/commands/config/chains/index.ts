import { Command } from '@oclif/core';
import terminalLink from 'terminal-link';

import Help from '@/plugins/help-plugin/help';
import { blueBright } from '@/utils';

/**
 * Command 'config chains'
 * Displays the help info for the 'config chains' command
 */
export default class ConfigChains extends Command {
  static summary = `Chain management commands. The chain files follow the ${terminalLink(
    blueBright('Cosmos chain registry schema'),
    'https://raw.githubusercontent.com/cosmos/chain-registry/master/chain.schema.json',
    {
      fallback: () => `${blueBright('https://raw.githubusercontent.com/cosmos/chain-registry/master/chain.schema.json')} schema`,
    }
  )}.`;

  /**
   * Runs the command.
   *
   * @returns Empty promise
   */
  public async run(): Promise<void> {
    const help = new Help(this.config, { all: true });
    await help.showCommandHelp(ConfigChains);
  }
}
