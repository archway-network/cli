import { BaseCommand } from '@/lib/base';
import path from 'node:path';
import { Args } from '@oclif/core';

import { DEFAULT } from '@/GlobalConfig';
import { bold, green } from '@/utils';
import { BuiltInChains } from '@/services';
import { ChainRegistry } from '@/domain';

/**
 * Command 'config chains export'
 * Exports a built-in chain's info into a chain registry file
 */
export default class ConfigChainsExport extends BaseCommand<typeof ConfigChainsExport> {
  static summary = `Exports a built-in chain registry file to ${bold(
    path.join('{project-root}', DEFAULT.ChainsRelativePath, `./{chain-id}${DEFAULT.ChainFileExtension}`)
  )}.`;

  static args = {
    chain: Args.string({ name: 'chain', required: true, options: BuiltInChains.getChainIds(), description: 'ID of the chain' }),
  };

  /**
   * Runs the command.
   *
   * @returns Empty promise
   */
  public async run(): Promise<void> {
    const chainRegistry = await ChainRegistry.init();

    await chainRegistry.export(this.args.chain);

    this.success(`${green('Exported chain to')} ${bold(path.join(chainRegistry.path, `./${this.args.chain}.json`))}`);
  }
}
