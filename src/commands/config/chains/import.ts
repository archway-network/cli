import { BaseCommand } from '../../../lib/base';
import { DEFAULT } from '../../../config';
import path from 'node:path';
import { bold, green } from '../../../utils/style';
import { Args } from '@oclif/core';
import fs from 'node:fs/promises';
import { CosmosChain } from '../../../types/CosmosSchema';
import { ChainRegistry } from '../../../domain/ChainRegistry';
import { FileRequiredError, OnlyOneImportError } from '../../../exceptions';

export default class ConfigChainsImport extends BaseCommand<typeof ConfigChainsImport> {
  static summary = `Import a chain registry file and save it to ${bold(
    path.join('{project-root}', DEFAULT.ChainsRelativePath, './{chain-id}.json')
  )}.`;

  static args = {
    file: Args.string({ name: 'file', required: false, ignoreStdin: true }),
    piped: Args.string({ name: 'piped', required: false, hidden: true }),
  };

  public async run(): Promise<void> {
    if (this.args.file && this.args.piped) {
      this.error(new OnlyOneImportError().toConsoleString());
    } else if (!this.args.file && !this.args.piped) {
      this.error(new FileRequiredError().toConsoleString());
    }

    // If it is piped, parse the received content, otherwise try to open file
    const chainInfo: CosmosChain = this.args.piped ?
      JSON.parse(this.args.piped || '') :
      JSON.parse(await fs.readFile(this.args.file as string, 'utf-8'));

    const chainRegistry = await ChainRegistry.init();

    await chainRegistry.writeChainFile(chainInfo);

    this.log(`✅ ${green('Imported chain')} ${bold(chainInfo.chain_id)}`);
  }
}
