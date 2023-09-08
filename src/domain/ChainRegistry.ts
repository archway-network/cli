import path from 'node:path';
import ow from 'ow';

import { AlreadyExistsError, ErrorCodes, InvalidFormatError } from '@/exceptions';
import { BuiltInChains } from '@/services';
import { bold, fileExists, readFilesFromDirectory, redBright, writeFileWithDir, yellow } from '@/utils';
import { GLOBAL_CONFIG_PATH } from './Config';

import { ChainRegistrySpec, ConsoleError, CosmosChain, cosmosChainValidator } from '@/types';

export const GLOBAL_CHAINS_PATH = `${GLOBAL_CONFIG_PATH}/chains`;

export const DEFAULT_CHAIN_ID = 'constantine-3';
export const CHAIN_FILE_EXTENSION = '.json';

/**
 * Manages the chains in the project, including the built-in and the imported ones.
 */
export class ChainRegistry extends ChainRegistrySpec {
  private _data: CosmosChain[];
  private _dirPath: string;
  private _warnings: ChainWarning[];

  /**
   * @param data - List of the {@link CosmosChain} representation of the chains in the project
   * @param dirPath - Absolute path of the imported chain config files
   * @param warning - List of warnings related to the chain config files
   */
  constructor(data: CosmosChain[], dirPath: string, warning: ChainWarning[]) {
    super();
    this._data = data;
    this._dirPath = dirPath;
    this._warnings = warning;
  }

  get listChains(): CosmosChain[] {
    return this._data;
  }

  get dirPath(): string {
    return this._dirPath;
  }

  get warnings(): ChainWarning[] | undefined {
    return this._warnings;
  }

  /**
   * Initializes the Chain Registry, by loading the built-in chains and reading the imported chain files.
   *
   * @param chainsDir - Optional - Path to the directory where the imported chains are. Defaults to '~/.config/archway/chains/'
   * @returns Promise containing a {@link ChainRegistry} instance
   */
  static async init(chainsDir = GLOBAL_CHAINS_PATH): Promise<ChainRegistry> {
    let filesRead: Record<string, string> = {};

    try {
      filesRead = await readFilesFromDirectory(chainsDir, CHAIN_FILE_EXTENSION);
    } catch {}

    // List of built-in chains that could be added to final result
    const builtInToAdd = { ...BuiltInChains.chainMap };

    // List of warnings found while reading files
    const warnings: ChainWarning[] = [];

    // Parse file contents, and check if they override built-in chain info
    const parsedList: CosmosChain[] = [];
    for (const [fileName, file] of Object.entries(filesRead)) {
      const fileNameChainId = path.basename(fileName, CHAIN_FILE_EXTENSION);
      const parsed: CosmosChain = JSON.parse(file);

      // If file has a valid format, continue
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
    return new ChainRegistry([...Object.values(builtInToAdd), ...parsedList], chainsDir, warnings);
  }

  /**
   * Verify if an object has the valid format of a {@link CosmosChain}, throws error if not
   *
   * @param data - Object instance to validate
   * @param name - Optional - Name of the file, will be used in the possible error
   * @returns void
   */
  static assertIsValidChain = (data: unknown, name?: string): void => {
    if (!this.isValidChain(data)) throw new InvalidFormatError(name || 'Chain file');
  };

  /**
   * Verify if an object has the valid format of a {@link CosmosChain}
   *
   * @param data - Object instance to validate
   * @returns Boolean, whether it is valid or not
   */
  static isValidChain = (data: unknown): boolean => {
    return ow.isValid(data, cosmosChainValidator);
  };

  /**
   * Get the absolute path of the file of a specific chain in the imported chains directory
   *
   * @param chainId - Chain id of the file (will match the name of the file)
   * @returns Promise containig the absolute path of the chain file
   */
  async getFilePath(chainId: string): Promise<string> {
    return path.join(this._dirPath, `./${chainId}${CHAIN_FILE_EXTENSION}`);
  }

  /**
   * Check if a chain file exists or not
   *
   * @param chainId - Chain id of the file to verify
   * @returns Promise containing true or false
   */
  async fileExists(chainId: string): Promise<boolean> {
    const chainPath = await this.getFilePath(chainId);
    return fileExists(chainPath);
  }

  /**
   * Check if a chain exists in the registry by chain id, if not found throws an error
   *
   * @param chainId - Chain Id to get
   * @returns void
   */
  assertGetChainById(chainId: string): void {
    if (!this.getChainById(chainId)) throw new ChainIdNotFoundError(chainId);
  }

  /**
   * Get a chain from the registry by chain id
   *
   * @param chainId - Chain Id to get
   * @returns The {@link CosmosChain} that matches the id, or undefined if not found
   */
  getChainById(chainId: string): CosmosChain | undefined {
    return this._data.find(item => item.chain_id === chainId);
  }

  /**
   * Write a {@link CosmosChain} object into a file in the chain directory, throws an error if it already exists
   *
   * @param chain - {@link CosmosChain} object to write
   */
  async writeChainFile(chain: CosmosChain): Promise<void> {
    const newChainId = chain.chain_id;

    if (await this.fileExists(newChainId)) {
      throw new AlreadyExistsError('Chain info file', `${newChainId}${CHAIN_FILE_EXTENSION}`);
    }

    return this.forceWriteChainFile(chain);
  }

  /**
   * Write a {@link CosmosChain} object into a file in the chain directory (overwrites if it already exists)
   *
   * @param chain - {@link CosmosChain} object to write
   */
  async forceWriteChainFile(chain: CosmosChain): Promise<void> {
    const newChainId = chain.chain_id;

    const jsonData = JSON.stringify(chain, null, 2);

    await writeFileWithDir(await this.getFilePath(newChainId), jsonData);
    // Remove from warnings if it is listed there
    if (this._warnings) this._warnings = this._warnings.filter(item => item.filename !== newChainId);

    // Add to inner data
    this._data = this._data.map(item => (item.chain_id === newChainId ? chain : item));
  }

  /**
   * Imports a chain info object, and saves it into a file
   *
   * @param chainInfo - Chain info object to be imported
   */
  async import(chainInfo: CosmosChain): Promise<void> {
    ChainRegistry.assertIsValidChain(chainInfo);

    await this.writeChainFile(chainInfo);
  }

  /**
   * Get a formatted version of the chain registry warnings
   *
   * @param chainId - Optional - Allow to return the warnings of only one chain
   * @returns Array of the warnings
   */
  prettyPrintWarnings(chainId?: string): string[] {
    const result: string[] = [];

    for (const item of this._warnings) {
      if (!chainId || chainId === item.filename) {
        result.push(item.message);
      }
    }

    return result;
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

  /**
   * {@inheritDoc ConsoleError.toConsoleString}
   */
  toConsoleString(): string {
    return `${redBright('Chain id')} ${bold(this.chainId)} ${redBright('not found')}`;
  }
}
