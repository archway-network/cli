import { getWokspaceRoot } from '../utils/paths';
import path from 'node:path';
import { DEFAULT } from '../config';
import { CosmosChain } from '../types/CosmosSchema';
import fs from 'node:fs/promises';
import { BuiltInChains } from '../services/BuiltInChains';
import { readFilesFromDirectory, writeFileWithDir } from '../utils/filesystem';
import { FileAlreadyExistsError } from '../exceptions';
import { bold, red, yellow } from '../utils/style';
import { ConsoleError } from '../types/ConsoleError';
import { ErrorCodes } from '../exceptions/ErrorCodes';

export class ChainRegistry {
  private _data: CosmosChain[];
  private _path: string;
  private _warnings?: string[];

  constructor(data: CosmosChain[], path: string, warning?: string[]) {
    this._data = data;
    this._path = path;
    this._warnings = warning;
  }

  get data(): CosmosChain[] {
    return this._data;
  }

  get path(): string {
    return this._path;
  }

  get warnings(): string[] | undefined {
    return this._warnings;
  }

  static async init(chainsDirectory?: string): Promise<ChainRegistry> {
    const directoryPath = chainsDirectory || (await this.getDirectoryPath());

    let filesRead: Record<string, string> = {};

    try {
      filesRead = await readFilesFromDirectory(directoryPath, DEFAULT.ChainFileExtension);
    } catch {}

    // List of built-in chains that could be added to final result
    const builtInToAdd = { ...BuiltInChains.chainMap };

    // Chains with chain id warnings
    const warnings: string[] = [];

    // Parse file contents, and check if they override built-in chain info
    const parsedList: CosmosChain[] = [];
    for (const [fileName, file] of Object.entries(filesRead)) {
      const fileNameChainId = path.basename(fileName, DEFAULT.ChainFileExtension);
      const parsed: CosmosChain = JSON.parse(file);

      // If filename is different than parsed chain id, add to warning
      if (fileNameChainId !== parsed.chain_id) {
        warnings.push(fileNameChainId);
      }

      if (BuiltInChains.getChainIds().includes(fileNameChainId)) {
        delete builtInToAdd[fileNameChainId];
      }

      parsedList.push(parsed);
    }

    // Create chain registry with the parsed chains and the built-in chains pending to add
    return new ChainRegistry([...Object.values(builtInToAdd), ...parsedList], directoryPath, warnings);
  }

  static async getDirectoryPath(): Promise<string> {
    return path.join(await getWokspaceRoot(), DEFAULT.ChainsRelativePath);
  }

  static async getFilePath(chainId: string): Promise<string> {
    return path.join(await getWokspaceRoot(), DEFAULT.ChainsRelativePath, `./${chainId}${DEFAULT.ChainFileExtension}`);
  }

  static async exists(chainId: string): Promise<boolean> {
    const chainPath = await this.getFilePath(chainId);
    try {
      await fs.access(chainPath);
      return true;
    } catch {
      return false;
    }
  }

  assertGetChainById(chainId: string): void {
    if (!this.getChainById(chainId)) throw new ChainIdNotFoundError(chainId);
  }

  getChainById(chainId: string): CosmosChain | undefined {
    return this._data.find(item => item.chain_id === chainId);
  }

  async writeChainFile(chain: CosmosChain, canOverride = false): Promise<void> {
    const newChainId = chain.chain_id;

    if (!canOverride && (await ChainRegistry.exists(newChainId))) {
      throw new FileAlreadyExistsError(`${newChainId}${DEFAULT.ChainFileExtension}`);
    }

    const json = JSON.stringify(chain, null, 2);

    await writeFileWithDir(path.join(this._path, `./${newChainId}.json`), json);
    // Remove from warnings if it is listed there
    if (this._warnings) this._warnings = this._warnings.filter(item => item !== newChainId);

    // Add to inner data
    this._data = this._data.map(item => (item.chain_id === newChainId ? chain : item));
  }

  prettyPrintWarnings(chainId?: string): string[] {
    const result: string[] = [];

    for (const item of this._warnings || []) {
      if (!chainId || chainId === item) {
        result.push(
          `${yellow('Attention:')} the${chainId ? '' : ` ${bold(item)}`} chain spec file name does not match the chain_id property`
        );
      }
    }

    return result;
  }
}

export class ChainIdNotFoundError extends ConsoleError {
  chainId: string;

  constructor(chainId: string) {
    super(ErrorCodes.CHAIN_ID_NOT_FOUND);
    this.chainId = chainId;
  }

  toConsoleString(): string {
    return `${red('Chain id')} ${bold(this.chainId)} ${red('not found')}`;
  }
}
