import { BaseCommand } from '../../../lib/base';
import path from 'node:path';
import { Args } from '@oclif/core';

import { DEFAULT } from '../../../config';
import { bold, green } from '../../../utils/style';
import { BuiltInChains } from '../../../services/BuiltInChains';
import { ChainRegistry } from '../../../domain/ChainRegistry';
import { CosmosChain } from '../../../types/Chain';

/**
 * Command 'config chains export'
 * Exports a built-in chain's info into a chain registry file
 */
export default class ConfigChainsExport extends BaseCommand<typeof ConfigChainsExport> {
  static summary = `Exports a built-in chain registry file to ${bold(
    path.join('{project-root}', DEFAULT.ChainsRelativePath, `./{chain-id}${DEFAULT.ChainFileExtension}`)
  )}.`;

  static args = {
    chain: Args.string({ name: 'chain', required: true, options: BuiltInChains.getChainIds() }),
  };

  /**
   * Runs the command.
   *
   * @returns Empty promise
   */
  public async run(): Promise<void> {
    const chainRegistry = await ChainRegistry.init();

    await chainRegistry.writeChainFile(BuiltInChains.getChainById(this.args.chain) as CosmosChain);

    this.success(`${green('Exported chain to')} ${bold(path.join(chainRegistry.path, `./${this.args.chain}.json`))}`);
  }
}
