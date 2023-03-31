import { BaseCommand } from '../../../lib/base';
import { DefaultChainsRelativePath } from '../../../config';
import path from 'node:path';
import { bold, green, red } from '../../../utils/style';
import { Args } from '@oclif/core';
import fs from 'node:fs/promises';
import { CosmosChain } from '../../../types/CosmosSchema';
import { ChainRegistry } from '../../../domain/ChainRegistry';

export default class ConfigChainsImport extends BaseCommand<typeof ConfigChainsImport> {
  static summary = `Import a chain registry file and save it to ${bold(
    path.join('{project-root}', DefaultChainsRelativePath, './{chain-id}.json')
  )}.`;

  static args = {
    file: Args.string({ name: 'file', required: false }),
  };

  public async run(): Promise<void> {
    // to do add pipe support
    // if (this.args.file && this.argv.length === 1) {
    //   this.error(`❌ ${red('Please specify only one file to import')}`);
    // } else if (!this.args.file) {
    //   this.error(`❌ ${red('Please specify the file to import as an argument, or pass the chain info in a pipe')}`);
    // }

    const chainInfo: CosmosChain = JSON.parse(await fs.readFile(this.args.file as string, 'utf-8'));

    const chainRegistry = await ChainRegistry.init();

    await chainRegistry.writeChainFile(chainInfo);

    this.log(`✅ ${green('Imported chain')} ${bold(chainInfo.chain_id)}`);
  }
}
