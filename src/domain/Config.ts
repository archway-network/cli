import { ArchwayClient, SigningArchwayClient } from '@archwayhq/arch3.js';
import { StargateClient } from '@cosmjs/stargate';
import _ from 'lodash';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import ow from 'ow';

import { ChainRegistry, Contracts, Deployments } from '@/domain';
import { AlreadyExistsError, InvalidFormatError, NotFoundError } from '@/exceptions';
import {
  AccountWithSigner,
  ConfigData,
  ConfigDataWithContracts,
  Contract,
  CosmosChain,
  Deployment,
  KeystoreBackendType,
  MergeMode,
  configDataValidator
} from '@/types';
import { bold, fileExists, getWorkspaceRoot, mergeCustomizer, prettyPrintTransaction, writeFileWithDir } from '@/utils';

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

/** Default signer constants */
export const DEFAULT_GAS_ADJUSTMENT = 1.3;

/**
 * Manages the config file of the project and creates instances of ChainRegistry and Contracts
 */
export class Config {
  private _workspaceRoot: string;
  private _contracts: Contracts;
  private _chainRegistry: ChainRegistry;
  private _globalConfigData: ConfigData;
  private _localConfigData: ConfigData;

  /**
   * @param workspaceRoot - Absolute path of the project's workspace root
   * @param contracts - Instance of {@link Contracts} of the project
   * @param chainRegistry - Instance of {@link ChainRegistry} of the project
   * @param globalConfigData - Instance of {@link ConfigData} representing the global data of the project
   * @param localConfigData - Instance of {@link ConfigData} representing the local data of the project
   */
  // eslint-disable-next-line max-params
  constructor(
    workspaceRoot: string,
    contracts: Contracts,
    chainRegistry: ChainRegistry,
    globalConfigData: ConfigData,
    localConfigData: ConfigData
  ) {
    this._workspaceRoot = workspaceRoot;
    this._contracts = contracts;
    this._chainRegistry = chainRegistry;
    this._globalConfigData = globalConfigData;
    this._localConfigData = localConfigData;
  }

  get workspaceRoot(): string {
    return this._workspaceRoot;
  }

  get contractsInstance(): Contracts {
    return this._contracts;
  }

  get deploymentsInstance(): Deployments {
    return this._contracts.deployments;
  }

  get chainRegistry(): ChainRegistry {
    return this._chainRegistry;
  }

  get contracts(): Contract[] {
    return this._contracts.listContracts();
  }

  get deployments(): Deployment[] {
    return this._contracts.deployments.listDeployments();
  }

  get globalConfigData(): ConfigData {
    return this._globalConfigData;
  }

  get localConfigData(): ConfigData {
    return this._localConfigData;
  }

  /** Returns the resolved version with precedence of local \> global \> default */
  get configData(): ConfigData {
    return _.merge(DEFAULT_CONFIG_DATA, this._globalConfigData, this._localConfigData);
  }

  /** Getters for the fields from ConfigData */
  get chainId(): string {
    return this.configData['chain-id']!;
  }

  get contractsPath(): string {
    return this.configData['contracts-path']!;
  }

  get keyringBackend(): KeystoreBackendType {
    return this.configData['keyring-backend']!;
  }

  get keyringPath(): string {
    return this.configData['keyring-path']!;
  }

  get defaultAccount(): string | undefined {
    return this.configData['default-account'];
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

    let data: ConfigData = {};

    const exists = await fileExists(configPath);

    if (exists) {
      data = JSON.parse(await fs.readFile(configPath, 'utf8'));
      this.assertIsValidConfigData(data, configPath);
    }

    return data;
  }

  /**
   * Verify if an object has the valid format of a {@link ConfigData}, throws error if not
   *
   * @param data - Object instance to validate
   * @param name - Optional - Name of the file, will be used in the possible error
   * @returns void
   */
  static assertIsValidConfigData = (data: unknown, name?: string): void => {
    if (!this.isValidConfigData(data)) throw new InvalidFormatError(name || 'Config file');
  };

  /**
   * Verify if an object has the valid format of a {@link ConfigData}
   *
   * @param data - Object instance to validate
   * @returns Boolean, whether it is valid or not
   */
  static isValidConfigData = (data: unknown): boolean => {
    return ow.isValid(data, configDataValidator);
  };

  /**
   * Write the data of the {@link Config} instance into the local or global config file
   *
   * @param global - Optional - Write the data into the global config, defaults to false
   * @returns Empty promise
   */
  async write(global = false): Promise<void> {
    const configPath = await Config.getFilePath(this._workspaceRoot, global);

    await writeFileWithDir(configPath, JSON.stringify(global ? this._globalConfigData : this._localConfigData, undefined, 2));
  }

  /**
   * Updates the data of the {@link Config} (local or global), overwriting the passed values
   *
   * @param newData - Partial object of {@link ConfigData} that will be updated
   * @param global - Optional - Update the global config, defaults to false
   * @param writeAfterUpdate - Optional - Allows the function to write to the file after updating the object's data, defaults to true
   * @param arrayMergeMode - Optional - Different merge modes, can be OVERWRITE, APPEND, or PREPEND
   */
  async update(newData: Partial<ConfigData>, global = false, writeAfterUpdate = true, arrayMergeMode = MergeMode.OVERWRITE): Promise<void> {
    if (global) {
      this._globalConfigData = _.mergeWith(this._globalConfigData, newData, mergeCustomizer(arrayMergeMode));
    } else {
      this._localConfigData = _.mergeWith(this._localConfigData, newData, mergeCustomizer(arrayMergeMode));
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
  async activeChainInfo(): Promise<CosmosChain> {
    const result = this._chainRegistry.getChainById(this.chainId);

    if (!result) throw new NotFoundError("Chain in the project's configuration", this.chainId);

    return result;
  }

  /**
   * Get the rpc endpoint of the currently active chain in the project
   *
   * @param chainInfo - Optional - Instance of {@link CosmosChain} to extract the endpoint from
   * @returns Promise containing the rpc endpoint, throws an error if not found
   */
  async activeChainRpcEndpoint(chainInfo?: CosmosChain): Promise<string> {
    const auxInfo = chainInfo || (await this.activeChainInfo());

    if (!auxInfo.apis?.rpc?.[0]?.address) throw new NotFoundError('Rpc endpoint for chain', this.chainId);

    return auxInfo.apis.rpc[0].address;
  }

  /**
   * Get a Stargate client of the currently active chain in the project
   *
   * @returns Promise containing the {@link StargateClient}
   */
  async getStargateClient(): Promise<StargateClient> {
    const rpcEndpoint = await this.activeChainRpcEndpoint();

    return StargateClient.connect(rpcEndpoint);
  }

  /**
   * Get an Archway client of the currently active chain in the project
   *
   * @returns Promise containing the {@link ArchwayClient}
   */
  async getArchwayClient(): Promise<ArchwayClient> {
    const rpcEndpoint = await this.activeChainRpcEndpoint();

    return ArchwayClient.connect(rpcEndpoint);
  }

  /**
   * Get a Signing Archway client of the currently active chain in the project
   *
   * @returns Promise containing the {@link StargateClient}
   */
  async getSigningArchwayClient(
    { signer }: AccountWithSigner,
    gasAdjustment = DEFAULT_GAS_ADJUSTMENT
  ): Promise<SigningArchwayClient> {
    const chainInfo = await this.activeChainInfo();
    const rpcEndpoint = await this.activeChainRpcEndpoint(chainInfo);

    return SigningArchwayClient.connectWithSigner(rpcEndpoint, signer, { gasAdjustment });
  }

  /**
   * Get a formatted version of config file
   *
   * @param withContracts - Optional - Fetchs the contract data and adds it to the formatted message
   * @returns Promise containing the formatted config file
   */
  async prettyPrint(withContracts = true): Promise<string> {
    let contractsStatus = '';

    if (withContracts) {
      contractsStatus = `\n${await this.contractsInstance.prettyPrint()}`;
    }

    return (
      `${bold('Chain id: ')}${this.chainId}\n` +
      `${bold('Contracts path: ')}${this.contractsPath}\n` +
      `${bold('Keyring backend: ')}${this.keyringBackend}\n` +
      `${bold('Keyring files path: ')}${this.keyringPath}\n` +
      (this.defaultAccount ? `${bold('Default account: ')}${this.defaultAccount}\n` : '') +
      contractsStatus
    );
  }

  /**
   * Get a formatted version of a transaction hash, with clickable link when possible
   *
   * @param txHash - Hash of the transaction
   * @returns Transaction hash, with clickable tx link when available
   */
  async prettyPrintTxHash(txHash: string): Promise<string> {
    const explorerTxUrl = this._chainRegistry.getChainById(this.chainId)?.explorers?.find(item => Boolean(item.tx_page))?.tx_page;

    return prettyPrintTransaction(txHash, explorerTxUrl);
  }

  /**
   * Get an object representation of the config file data + the contracts data
   *
   * @returns Instance of {@link ConfigDataWithContracts}
   */
  async dataWithContracts(): Promise<ConfigDataWithContracts> {
    return {
      ...this.configData,
      contracts: this.contractsInstance.listContracts(),
    };
  }

  /**
   * {@inheritDoc Contracts.assertIsValidWorkspace}
   */
  async assertIsValidWorkspace(): Promise<void> {
    return this.contractsInstance.assertIsValidWorkspace();
  }
}
