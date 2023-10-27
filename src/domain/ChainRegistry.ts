import path from 'node:path';

import { Schema } from 'ajv';
import debugInstance from 'debug';

import { AlreadyExistsError, ConsoleError, ErrorCodes, InvalidFormatError } from '@/exceptions';
import CosmosChainSchema from '@/repositories/chain.schema.json';
import { BuiltInChains } from '@/services';
import { CosmosChain } from '@/types';
import { bold, getErrorMessage, pathExists, readFilesFromDirectory, redBright, writeFileWithDir, yellow } from '@/utils';

import { GLOBAL_CONFIG_PATH } from './Config';
import { SchemaValidator } from './SchemaValidation';

const debug = debugInstance('archway:domain:chain-registry');

export const GLOBAL_CHAINS_PATH = `${GLOBAL_CONFIG_PATH}/chains`;

export const DEFAULT_CHAIN_ID = 'constantine-3';
export const CHAIN_FILE_EXTENSION = '.json';

/**
 * Manages the chains in the project, including the built-in and the imported ones.
 */
export class ChainRegistry {
  public readonly dirPath: string;

  private readonly chainsMap: Record<string, CosmosChain>;
  private readonly warningsMap: Record<string, ChainWarning>;

  /**
   * @param dirPath - Absolute path of the imported chain config files
   * @param chains - List of the {@link CosmosChain} representation of the chains in the project
   * @param warning - List of warnings related to the chain config files
   */
  constructor(dirPath: string, chains: CosmosChain[] = [], warning: ChainWarning[] = []) {
    this.dirPath = dirPath;
    this.chainsMap = Object.fromEntries(chains.map(chain => [chain.chain_id, chain]));
    this.warningsMap = Object.fromEntries(warning.map(w => [w.filename, w]));
  }

  get chains(): readonly CosmosChain[] {
    return Object.values(this.chainsMap);
  }

  get warnings(): readonly ChainWarning[] {
    return Object.values(this.warningsMap);
  }

  /**
   * Get a chain from the registry by chain id
   *
   * @param chainId - Chain Id to get
   * @returns The {@link CosmosChain} that matches the id, or undefined if not found
   */
  getChainById(chainId: string): CosmosChain | undefined {
    return this.chainsMap[chainId];
  }

  /**
   * Check if a chain exists in the registry by chain id, if not found throws an error
   *
   * @param chainId - Chain Id to get
   */
  assertGetChainById(chainId: string): void {
    if (!this.getChainById(chainId)) {
      throw new ChainIdNotFoundError(chainId);
    }
  }

  /**
   * Get the absolute path of the file of a specific chain in the imported chains directory
   *
   * @param chainId - Chain id of the file (will match the name of the file)
   * @returns The absolute path of the chain file
   */
  getFilePath(chainId: string): string {
    return path.join(this.dirPath, `${chainId}${CHAIN_FILE_EXTENSION}`);
  }

  private addChain(chainId: string, chainInfo: CosmosChain): void {
    // Remove from warnings if it is listed there
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete this.warningsMap[chainId];
    this.chainsMap[chainId] = chainInfo;
  }

  /**
   * Initializes the Chain Registry, by loading the built-in chains and reading the imported chain files.
   *
   * @param chainsDir - Optional - Path to the directory where the imported chains are. Defaults to '~/.config/archway/chains'
   * @returns Promise containing a {@link ChainRegistry} instance
   */
  static async init(chainsDir = GLOBAL_CHAINS_PATH): Promise<ChainRegistry> {
    debug('init', { chainsDir });
    let filesRead: Record<string, string> = {};

    try {
      filesRead = await readFilesFromDirectory(chainsDir, CHAIN_FILE_EXTENSION);
    } catch { }

    // List of built-in chains that could be added to final result
    const builtInToAdd = { ...BuiltInChains.chainMap };

    // List of warnings found while reading files
    const warnings: ChainWarning[] = [];

    // Parse file contents, and check if they override built-in chain info
    const parsedList: CosmosChain[] = [];
    for (const [fileName, file] of Object.entries(filesRead)) {
      const fileNameChainId = path.basename(fileName, CHAIN_FILE_EXTENSION);
      const parsed = JSON.parse(file) as CosmosChain;

      if (this.isValidChain(parsed)) {
        // If filename is different than parsed chain id, add to warning
        if (fileNameChainId !== parsed.chain_id) {
          warnings.push({
            filename: fileNameChainId,
            message: `${yellow('Attention:')} the ${bold(fileNameChainId)} chain spec file name does not match the chain_id property`,
          });
        }

        // Remove from list of built-in chains if it overrides any of them
        if (BuiltInChains.getChainIds().includes(fileNameChainId)) {
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete builtInToAdd[fileNameChainId];
        }

        // Add to list of parsed chains
        parsedList.push(parsed);
        // Else file has an invalid format, add to warning
      } else {
        warnings.push({
          filename: fileNameChainId,
          message: `${yellow('Attention:')} the ${bold(fileNameChainId)} chain spec file has an invalid format, so it has been ignored`,
        });
      }
    }

    // Create chain registry with the parsed chains and the built-in chains pending to add
    return new ChainRegistry(chainsDir, [...Object.values(builtInToAdd), ...parsedList], warnings);
  }

  /**
   * Verify if an object has the valid format of a {@link CosmosChain}, throws error if not
   *
   * @param chainInfo - Chain info to validate
   * @param name - Optional - Name of the file, will be used in the possible error
   */
  static assertIsValidChain(chainInfo: unknown, name?: string): void {
    try {
      const schemaValidator = new SchemaValidator().withOptions({
        strictSchema: false,
        strictTypes: false,
      });
      schemaValidator.assertValid(CosmosChainSchema as Schema, chainInfo);
    } catch (error) {
      debug('Invalid chain file', { name, chainInfo, error });
      throw new InvalidFormatError(`the chain file${name ? ` "${name}"` : ''} does not match the schema: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Verify if an object has the valid format of a {@link CosmosChain}
   *
   * @param chainInfo - Chain info to validate
   * @returns Boolean, whether it is valid or not
   */
  static isValidChain(chainInfo: unknown): boolean {
    try {
      this.assertIsValidChain(chainInfo);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Imports a {@link CosmosChain} and saves it into a file in the chain directory
   *
   * @param chainInfo - Chain info object to be imported
   * @param overwrite - Optional - Whether to overwrite the file if it already exists. Defaults to false.
   *
   * @throws An {@link AlreadyExistsError} if the chain file already exists and overwrite is false
   */
  async import(chainInfo: CosmosChain, overwrite = false): Promise<void> {
    debug('Importing chain', { chainInfo, overwrite });
    ChainRegistry.assertIsValidChain(chainInfo);

    const chainId = chainInfo.chain_id;
    const chainInfoPath = this.getFilePath(chainId);

    if (!overwrite && await pathExists(chainInfoPath)) {
      throw new AlreadyExistsError('Chain info file', `${chainId}${CHAIN_FILE_EXTENSION}`);
    }

    const json = JSON.stringify(chainInfo, null, 2);
    await writeFileWithDir(chainInfoPath, json);

    this.addChain(chainId, chainInfo);
  }

  /**
   * Get a formatted version of the chain registry warnings
   *
   * @param chainId - Optional - Allow to return the warnings of only one chain
   * @returns Array of the warnings
   */
  prettyPrintWarnings(chainId?: string): readonly string[] {
    if (chainId) {
      const { message } = this.warningsMap[chainId] || {};
      return message ? [message] : [];
    }

    return this.warnings.map(w => w.message);
  }
}

/**
 * Warnings associated to a chain by its id
 */
export interface ChainWarning {
  filename: string;
  message: string;
}

/**
 * Error when chain id is not found
 */
class ChainIdNotFoundError extends ConsoleError {
  /**
   * @param chainId - Chain Id that triggered the error
   */
  constructor(public chainId: string) {
    super(ErrorCodes.CHAIN_ID_NOT_FOUND);
  }

  toConsoleString(): string {
    return `${redBright('Chain id')} ${bold(this.chainId)} ${redBright('not found')}`;
  }
}
