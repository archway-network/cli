import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import _ from 'lodash';
import ow from 'ow';

import { ChainRegistry, Contracts, Deployments } from '@/domain';
import { AlreadyExistsError, InvalidFormatError, NotFoundError } from '@/exceptions';
import {
  ConfigData,
  ConfigDataWithContracts,
  Contract,
  CosmosChain,
  Deployment,
  KeystoreBackendType,
  configDataValidator
} from '@/types';
import { MergeMode, bold, getWorkspaceRoot, mergeCustomizer, pathExists, prettyPrintTransaction, writeFileWithDir } from '@/utils';

import { DEFAULT_CHAIN_ID } from './ChainRegistry';
import { DEFAULT_CONTRACTS_RELATIVE_PATH } from './Contracts';

export const CONFIG_FILENAME = 'config.json';

export const GLOBAL_CONFIG_PATH = `${os.homedir()}/.config/archway`;
export const GLOBAL_CONFIG_FILE = `${GLOBAL_CONFIG_PATH}/${CONFIG_FILENAME}`;

export const LOCAL_CONFIG_PATH = '.archway';
export const LOCAL_CONFIG_FILE = path.join(LOCAL_CONFIG_PATH, CONFIG_FILENAME);

export const DEFAULT_CONFIG_DATA = {
  'chain-id': DEFAULT_CHAIN_ID,
  'contracts-path': DEFAULT_CONTRACTS_RELATIVE_PATH,
  'keyring-backend': KeystoreBackendType.os,
  'keyring-path': `${GLOBAL_CONFIG_PATH}/keys`,
};

/**
 * Manages the config file of the project and creates instances of ChainRegistry and Contracts
 */
export class Config {
  /**
   * @param workspaceRoot - Absolute path of the project's workspace root
   * @param contractsInstance - Instance of {@link Contracts} of the project
   * @param chainRegistry - Instance of {@link ChainRegistry} of the project
   * @param globalConfigData - Instance of {@link ConfigData} representing the global data of the project
   * @param localConfigData - Instance of {@link ConfigData} representing the local data of the project
   */
  // eslint-disable-next-line max-params, no-useless-constructor
  constructor(
    readonly workspaceRoot: string,
    readonly contractsInstance: Contracts,
    readonly chainRegistry: ChainRegistry,
    private globalConfigData: ConfigData,
    private localConfigData: ConfigData
  ) { }

  get contracts(): readonly Contract[] {
    return this.contractsInstance.contracts;
  }

  get deploymentsInstance(): Deployments {
    return this.contractsInstance.deployments;
  }

  get deployments(): Deployment[] {
    return this.contractsInstance.deployments.listDeployments();
  }

  get globalData(): ConfigData {
    return this.globalConfigData;
  }

  get localData(): ConfigData {
    return this.localConfigData;
  }

  /**
   * @returns The merged {@link ConfigData}, processed in this order: local config → global config → CLI default.
   */
  get data(): ConfigData {
    return _.merge(DEFAULT_CONFIG_DATA, this.globalConfigData, this.localConfigData);
  }

  /**
   * Get a representation of the config file data + the contracts data
   *
   * @returns Instance of {@link ConfigDataWithContracts}
   */
  get dataWithContracts(): ConfigDataWithContracts {
    return {
      ...this.data,
      contracts: this.contracts,
    };
  }

  /**
   * @returns The parsed chain ID
   */
  get chainId(): string {
    return this.data['chain-id']!;
  }

  /**
   * @returns The parsed contracts path
   */
  get contractsPath(): string {
    return this.data['contracts-path']!;
  }

  /**
   * @returns The parsed keyring backend
   */
  get keyringBackend(): KeystoreBackendType {
    return this.data['keyring-backend']!;
  }

  /**
   * @returns The parsed keyring path
   */
  get keyringPath(): string {
    return this.data['keyring-path']!;
  }

  /**
   * @returns The default account used for transactions, if defined
   */
  get defaultAccount(): string | undefined {
    return this.data['default-account'];
  }

  /**
   * Initializes a {@link Config} instance, opening the global config file, and the project's config file
   *
   * @param workingDir - Optional - Path of the working directory
   * @param overrideConfig - Optional - Instance of {@link ConfigData} with values that we want to override on top of the existing config
   * @returns Promise containing an instance of {@link Config}
   */
  static async init(workingDir?: string, overrideConfig?: ConfigData): Promise<Config> {
    const globalConfig = await this.readConfigFile(workingDir, true);
    const localConfig = await this.readConfigFile(workingDir);

    return Config.make(globalConfig, { ...localConfig, ...overrideConfig }, workingDir);
  }

  /**
   * Create a {@link Config} instance, by receiving a {@link ConfigData} object
   *
   * @param globalConfigData - {@link ConfigData} representation of the global config file
   * @param localConfigData - {@link ConfigData} representation of the local project's config file
   * @param workingDir - Optional - Path of the working directory
   * @returns Promise containing an instance of {@link Config}
   */
  static async make(globalConfigData: ConfigData, localConfigData: ConfigData, workingDir?: string): Promise<Config> {
    const workspaceRoot = await getWorkspaceRoot(workingDir);
    const contracts = await Contracts.init(
      workingDir,
      localConfigData['contracts-path'] || globalConfigData['contracts-path'] || DEFAULT_CONFIG_DATA['contracts-path']
    );
    const chainRegistry = await ChainRegistry.init(workingDir);

    return new Config(workspaceRoot, contracts, chainRegistry, globalConfigData, localConfigData);
  }

  /**
   * Verify if the local config file exists
   *
   * @param workingDir - Optional - Path of the working directory
   * @returns Promise containing boolean
   */
  static async exists(workingDir?: string): Promise<boolean> {
    const localConfigPath = await this.getFilePath(workingDir);

    try {
      await fs.access(localConfigPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Creates a new config file if it doesn't exist
   *
   * @param chainId - Chain id that will be the default chain in the project
   * @param workingDir - Optional - Path of the working directory
   * @returns Promise containing an instance of {@link Config}
   */
  static async create(chainId: string, workingDir?: string): Promise<Config> {
    if (await Config.exists(workingDir)) {
      throw new AlreadyExistsError('Config file', LOCAL_CONFIG_FILE);
    }

    const globalConfig = await this.readConfigFile(workingDir, true);

    const configFile = await Config.make(globalConfig, {
      'chain-id': chainId,
      'contracts-path': DEFAULT_CONTRACTS_RELATIVE_PATH
    }, workingDir);

    await configFile.write();

    return configFile;
  }

  /**
   * Get the absolute path of the config file
   *
   * @param workingDir - Optional - Path of the working directory
   * @param global - Optional - Get the path for the global config, defaults to false
   * @returns Promise containing the absolute path of the config file
   */
  static async getFilePath(workingDir?: string, global = false): Promise<string> {
    if (global) {
      return GLOBAL_CONFIG_FILE;
    }

    const workspaceRoot = await getWorkspaceRoot(workingDir);

    return path.join(workspaceRoot, LOCAL_CONFIG_FILE);
  }

  /**
   * Reads the {@link ConfigData} representation of the local or global config from the config file
   *
   * @param workingDir - Optional - Path of the working directory
   * @param global - Optional - Get the data for the global config, defaults to false
   * @returns Promise containing the config data
   */
  static async readConfigFile(workingDir?: string, global = false): Promise<ConfigData> {
    const configPath = await this.getFilePath(workingDir, global);
    const exists = await pathExists(configPath);
    if (exists) {
      const file = await fs.readFile(configPath, 'utf8');
      const data = JSON.parse(file) as ConfigData;

      this.assertIsValidConfigData(data, configPath);

      return data;
    }

    return {};
  }

  /**
   * Verify if an object has the valid format of a {@link ConfigData}, throws error if not
   *
   * @param data - Object instance to validate
   * @param name - Optional - Name of the file, will be used in the possible error
   */
  static assertIsValidConfigData(data: unknown, name?: string): void {
    if (!this.isValidConfigData(data)) {
      throw new InvalidFormatError(name || 'Config file');
    }
  }

  /**
   * Verify if an object has the valid format of a {@link ConfigData}
   *
   * @param data - Object instance to validate
   * @returns Boolean, whether it is valid or not
   */
  static isValidConfigData(data: unknown): boolean {
    return ow.isValid(data, configDataValidator);
  }

  /**
   * Get the absolute path of the config file
   *
   * @param global - Optional - Get the path for the global config, defaults to false
   * @returns Promise containing the absolute path of the config file
   */
  async getConfigPath(global = false): Promise<string> {
    return Config.getFilePath(this.workspaceRoot, global);
  }

  /**
   * Write the data of the {@link Config} instance into the local or global config file
   *
   * @param global - Optional - Write the data into the global config, defaults to false
   * @returns Empty promise
   */
  async write(global = false): Promise<void> {
    const configPath = await this.getConfigPath(global);
    await writeFileWithDir(configPath, JSON.stringify(global ? this.globalConfigData : this.localConfigData, undefined, 2));
  }

  /**
   * Updates the data of the {@link Config} (local or global), overwriting the passed values
   *
   * @param newData - Partial object of {@link ConfigData} that will be updated
   * @param global - Optional - Update the global config, defaults to false
   * @param writeAfterUpdate - Optional - Allows the function to write to the file after updating the object's data, defaults to true
   * @param arrayMergeMode - Optional - Different merge modes, can be OVERWRITE, APPEND, or PREPEND
   * @returns Empty promise
   */
  async update(newData: Partial<ConfigData>, global = false, writeAfterUpdate = true, arrayMergeMode = MergeMode.OVERWRITE): Promise<void> {
    if (global) {
      this.globalConfigData = _.mergeWith(this.globalConfigData, newData, mergeCustomizer(arrayMergeMode)) as ConfigData;
    } else {
      this.localConfigData = _.mergeWith(this.localConfigData, newData, mergeCustomizer(arrayMergeMode)) as ConfigData;
    }

    if (writeAfterUpdate) {
      await this.write(global);
    }
  }

  /**
   * Get the chain info of the currently active chain in the project
   *
   * @returns Promise containing the {@link CosmosChain} data
   */
  activeChainInfo(): CosmosChain {
    const result = this.chainRegistry.getChainById(this.chainId);
    if (result) {
      return result;
    }

    throw new NotFoundError("Chain in the project's configuration", this.chainId);
  }

  /**
   * Get the rpc endpoint of the currently active chain in the project
   *
   * @param chainInfo - Optional - Instance of {@link CosmosChain} to extract the endpoint from
   * @returns Promise containing the rpc endpoint, throws an error if not found
   */
  activeChainRpcEndpoint(chainInfo?: CosmosChain): string {
    const auxInfo = chainInfo || this.activeChainInfo();
    if (!auxInfo.apis?.rpc?.[0]?.address) {
      throw new NotFoundError('Rpc endpoint for chain', this.chainId);
    }

    return auxInfo.apis.rpc[0].address;
  }

  /**
   * Get a formatted version of config file
   *
   * @param withContracts - Optional - Fetches the contract data and adds it to the formatted message
   * @returns Promise containing the formatted config file
   */
  prettyPrint(withContracts = true): string {
    let contractsStatus = '';

    if (withContracts) {
      contractsStatus = `\n${this.contractsInstance.prettyPrint()}`;
    }

    return (
      `${bold('Chain id: ')}${this.chainId}\n`
      + `${bold('Contracts path: ')}${this.contractsPath}\n`
      + `${bold('Keyring backend: ')}${this.keyringBackend}\n`
      + `${bold('Keyring files path: ')}${this.keyringPath}\n`
      + (this.defaultAccount ? `${bold('Default account: ')}${this.defaultAccount}\n` : '')
      + contractsStatus
    );
  }

  /**
   * Get a formatted version of a transaction hash, with clickable link when possible
   *
   * @param txHash - Hash of the transaction
   * @returns Transaction hash, with clickable tx link when available
   */
  prettyPrintTxHash(txHash: string): string {
    const explorerTxUrl = this.chainRegistry.getChainById(this.chainId)?.explorers?.find(item => Boolean(item.tx_page))?.tx_page;

    return prettyPrintTransaction(txHash, explorerTxUrl);
  }

  /**
   * Verifies that a project has a valid workspace, throws an error if not
   *
   * @returns Empty promise
   */
  async assertIsValidWorkspace(): Promise<void> {
    return this.contractsInstance.assertIsValidWorkspace();
  }
}
