import fs from 'node:fs/promises';

import { Args, Flags } from '@oclif/core';

import { ChainRegistry } from '@/domain';
import { ConsoleError, ErrorCodes } from '@/exceptions';
import { BaseCommand } from '@/lib/base';
import { StdinInputArg } from '@/parameters/arguments';
import { ConfigData, CosmosChain } from '@/types';
import { showSpinner } from '@/ui';
import { bold, dim, greenBright, redBright } from '@/utils';

/**
 * Command 'config chains import'
 * Imports from an external chain registry file or from pipe input, and saves it into a file
 */
export default class ConfigChainsImport extends BaseCommand<typeof ConfigChainsImport> {
  static summary = 'Import a chain registry file and save it to the global configuration';

  static args = {
    file: Args.file({ name: 'file', required: false, ignoreStdin: true, description: 'Path to file to be imported' }),
    stdinInput: StdinInputArg,
  };

  static flags = {
    force: Flags.boolean({
      char: 'f',
      description: 'Overwrite existing chain with the same id',
      default: false,
    }),
  };

  static examples = [
    {
      description: 'Import a chain from a spec file',
      command: '<%= config.bin %> <%= command.id %> "other-chain.json"',
    },
    {
      description: 'Overwrite an existing chain',
      command: '<%= config.bin %> <%= command.id %> --force "other-chain.json"',
    },
    {
      description: 'Import a chain from stdin',
      command: dim('$ cat other-chain.json | <%= config.bin %> <%= command.id %>'),
    },
  ];

  /**
   * Runs the command.
   *
   * @returns Promise with a partial {@link ConfigData}
   */
  public async run(): Promise<Partial<ConfigData>> {
    const { chain_id: chainId } = await showSpinner(async () => {
      const chainInfo = await this.readChainInfo();

      const chainRegistry = await ChainRegistry.init();
      await chainRegistry.import(chainInfo, this.flags.force);

      return chainInfo;
    }, { text: 'Importing chain...' });

    this.success(`${greenBright('Imported chain')} ${bold(chainId)}`);

    return { 'chain-id': chainId };
  }

  private async readChainInfo(): Promise<CosmosChain> {
    if (this.args.file && this.args.stdinInput) {
      throw new OnlyOneImportError();
    } else if (!this.args.file && !this.args.stdinInput) {
      throw new ImportFileRequiredError();
    }

    const json = this.args.stdinInput || (await fs.readFile(this.args.file!, 'utf8'));

    return JSON.parse(json) as CosmosChain;
  }
}

/**
 * Error when user tries to import more than one file at the same time
 */
export class OnlyOneImportError extends ConsoleError {
  constructor() {
    super(ErrorCodes.ONLY_ONE_IMPORT);
  }

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

  toConsoleString(): string {
    return `${redBright('Please specify the file to be imported')}`;
  }
}
