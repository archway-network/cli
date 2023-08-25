import { BaseCommand } from '@/lib/base';
import path from 'node:path';
import { Args } from '@oclif/core';

import { bold, greenBright } from '@/utils';
import { BuiltInChains } from '@/services';
import { CHAIN_FILE_EXTENSION, ChainRegistry, DEFAULT_CHAINS_RELATIVE_PATH } from '@/domain';

/**
 * Command 'config chains export'
 * Exports a built-in chain's info into a chain registry file
 */
export default class ConfigChainsExport extends BaseCommand<typeof ConfigChainsExport> {
  static summary = `Exports a built-in chain registry file to ${bold(
    path.join('{project-root}', DEFAULT_CHAINS_RELATIVE_PATH, `./{chain-id}${CHAIN_FILE_EXTENSION}`)
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

    await this.successMessage(chainRegistry, this.args.chain);
  }

  protected async successMessage(chainRegistry: ChainRegistry, chainId: string): Promise<void> {
    this.success(`${greenBright('Exported chain to')} ${bold(path.join(chainRegistry.path, `./${chainId}.json`))}`);

    if (this.jsonEnabled()) this.logJson({ chainId });
  }
}
