import { Args } from '@oclif/core';
import fs from 'node:fs/promises';

import { BaseCommand } from '@/lib/base';
import { bold, dim, greenBright, redBright } from '@/utils';
import { ChainRegistry } from '@/domain';
import { ErrorCodes } from '@/exceptions';
import { StdinInputArg } from '@/parameters/arguments';

import { ConsoleError, CosmosChain } from '@/types';

/**
 * Command 'config chains import'
 * Imports from an external chain registry file or from pipe input, and saves it into a file
 */
export default class ConfigChainsImport extends BaseCommand<typeof ConfigChainsImport> {
  static summary = 'Import a chain registry file and save it to the global configuration';

  static args = {
    file: Args.string({ name: 'file', required: false, ignoreStdin: true, description: 'Path to file to be imported' }),
    stdinInput: StdinInputArg,
  };

  static examples = [
    {
      description: 'Import a chain from a spec file',
      command: '<%= config.bin %> <%= command.id %> --file "other-chain.json"',
    },
    {
      description: 'Import a chain from stdin',
      command: dim('$ cat other-chain.json | <%= config.bin %> <%= command.id %>'),
    },
  ];

  /**
   * Runs the command.
   *
   * @returns Empty promise
   */
  public async run(): Promise<void> {
    if (this.args.file && this.args.stdinInput) {
      throw new OnlyOneImportError();
    } else if (!this.args.file && !this.args.stdinInput) {
      throw new ImportFileRequiredError();
    }

    // If it is piped, parse the received content, otherwise try to open file
    const chainInfo: CosmosChain = JSON.parse(this.args.stdinInput || (await fs.readFile(this.args.file as string, 'utf-8')));

    const chainRegistry = await ChainRegistry.init();

    await chainRegistry.import(chainInfo);

    await this.successMessage(chainInfo.chain_id);
  }

  protected async successMessage(chainId: string): Promise<void> {
    this.success(`${greenBright('Imported chain')} ${bold(chainId)}`);

    if (this.jsonEnabled()) this.logJson({ 'chain-id': chainId });
  }
}

/**
 * Error when user tries to import more than one file at the same time
 */
export class OnlyOneImportError extends ConsoleError {
  constructor() {
    super(ErrorCodes.ONLY_ONE_IMPORT);
  }

  /**
   * {@inheritDoc ConsoleError.toConsoleString}
   */
  toConsoleString(): string {
    return `${redBright('Please specify only one file to import')}`;
  }
}

/**
 * Error when a file is required
 */

export class ImportFileRequiredError extends ConsoleError {
  constructor() {
    super(ErrorCodes.FILE_REQUIRED);
  }

  /**
   * {@inheritDoc ConsoleError.toConsoleString}
   */
  toConsoleString(): string {
    return `${redBright('Please specify the file to be imported')}`;
  }
}
