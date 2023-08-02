import path from 'node:path';
import { Args } from '@oclif/core';
import fs from 'node:fs/promises';

import { BaseCommand } from '@/lib/base';
import { DEFAULT } from '@/GlobalConfig';
import { bold, green, red } from '@/utils';
import { ChainRegistry } from '@/domain';
import { ErrorCodes } from '@/exceptions';
import { stdinInput } from '@/arguments';

import { ConsoleError, CosmosChain } from '@/types';

/**
 * Command 'config chains import'
 * Imports from an external chain registry file or from pipe input, and saves it into a file
 */
export default class ConfigChainsImport extends BaseCommand<typeof ConfigChainsImport> {
  static summary = `Import a chain registry file and save it to ${bold(
    path.join('{project-root}', DEFAULT.ChainsRelativePath, './{chain-id}.json')
  )}.`;

  static args = {
    file: Args.string({ name: 'file', required: false, ignoreStdin: true, description: 'Path to file to be imported' }),
    stdinInput
  };

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
    const chainInfo: CosmosChain = this.args.stdinInput ?
      JSON.parse(this.args.stdinInput || '') :
      JSON.parse(await fs.readFile(this.args.file as string, 'utf-8'));

    const chainRegistry = await ChainRegistry.init();

    await chainRegistry.import(chainInfo);

    this.success(`${green('Imported chain')} ${bold(chainInfo.chain_id)}`);
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
    return `${red('Please specify only one file to import')}`;
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
    return `${red('Please specify the file to be imported')}`;
  }
}
