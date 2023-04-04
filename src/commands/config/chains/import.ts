import { BaseCommand } from '../../../lib/base';
import { DEFAULT } from '../../../config';
import path from 'node:path';
import { bold, green } from '../../../utils/style';
import { Args } from '@oclif/core';
import fs from 'node:fs/promises';
import { CosmosChain } from '../../../types/CosmosSchema';
import { ChainRegistry } from '../../../domain/ChainRegistry';

export default class ConfigChainsImport extends BaseCommand<typeof ConfigChainsImport> {
  static summary = `Import a chain registry file and save it to ${bold(
    path.join('{project-root}', DEFAULT.ChainsRelativePath, './{chain-id}.json')
  )}.`;

  static args = {
    file: Args.string({ name: 'file', required: false }),
  };

  public async run(): Promise<void> {
    const chainInfo: CosmosChain = JSON.parse(await fs.readFile(this.args.file as string, 'utf-8'));

    const chainRegistry = await ChainRegistry.init();

    await chainRegistry.writeChainFile(chainInfo);

    this.log(`✅ ${green('Imported chain')} ${bold(chainInfo.chain_id)}`);
  }
}
