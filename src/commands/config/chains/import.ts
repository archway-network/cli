import { BaseCommand } from '../../../lib/base';
import { DEFAULT } from '../../../config';
import path from 'node:path';
import { bold, green, red } from '../../../utils/style';
import { Args } from '@oclif/core';
import fs from 'node:fs/promises';
import { CosmosChain } from '../../../types/CosmosSchema';
import { ChainRegistry } from '../../../domain/ChainRegistry';
import { FileRequiredError } from '../../../exceptions';
import { ConsoleError } from '../../../types/ConsoleError';
import { ErrorCodes } from '../../../exceptions/ErrorCodes';

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
      throw new OnlyOneImportError();
    } else if (!this.args.file && !this.args.piped) {
      throw new FileRequiredError();
    }

    // If it is piped, parse the received content, otherwise try to open file
    const chainInfo: CosmosChain = this.args.piped ?
      JSON.parse(this.args.piped || '') :
      JSON.parse(await fs.readFile(this.args.file as string, 'utf-8'));

    const chainRegistry = await ChainRegistry.init();

    await chainRegistry.writeChainFile(chainInfo);

    this.success(`${green('Imported chain')} ${bold(chainInfo.chain_id)}`);
  }
}

export class OnlyOneImportError extends ConsoleError {
  constructor() {
    super(ErrorCodes.ONLY_ONE_IMPORT);
  }

  toConsoleString(): string {
    return `${red('Please specify only one file to import')}`;
  }
}
