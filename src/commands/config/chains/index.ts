import { Command } from '@oclif/core';
import terminalLink from 'terminal-link';

import Help from '@/plugins/help-plugin/help';
import { blue } from '@/utils';

/**
 * Command 'config chains'
 * Displays the help info for the 'config chains' command
 */
export default class ConfigChains extends Command {
  static summary = `Chain management commands. The chain files follow the ${blue(
    terminalLink('Cosmos chain registry schema', 'https://raw.githubusercontent.com/cosmos/chain-registry/master/chain.schema.json', {
      fallback: () => 'https://raw.githubusercontent.com/cosmos/chain-registry/master/chain.schema.json schema',
    })
  )}.`;

  static hidden = true;

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
