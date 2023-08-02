import fs from 'node:fs/promises';
import path from 'node:path';
import _ from 'lodash';
import ow from 'ow';
import { GasPrice, StargateClient } from '@cosmjs/stargate';

import { getWorkspaceRoot } from '@/utils/paths';
import { mergeCustomizer } from '@/utils';
import { ACCOUNTS, DEFAULT } from '@/config';
import { bold } from '@/utils/style';
import { Contracts } from './Contracts';
import { AlreadyExistsError, NotFoundError } from '@/exceptions';
import { writeFileWithDir } from '@/utils/filesystem';
import { InvalidFormatError } from '@/exceptions';
import { Deployments } from './Deployments';
import { sanitizeDirName } from '@/utils/sanitize';
import { ChainRegistry } from './ChainRegistry';

import { MergeMode } from '@/types/utils';
import { CosmosChain } from '@/types/Chain';
import { DeploymentWithChain } from '@/types/Deployment';
import { Contract } from '@/types/Contract';
import { ConfigData, ConfigDataWithContracts, configDataValidator } from '@/types/ConfigData';
import { SigningArchwayClient } from '@archwayhq/arch3-core';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { AccountWithMnemonic } from '@/types/Account';

/**
 * Manages the config file of the project and creates instances of ChainRegistry, Deployments and Contracts
 */
export class Config {
  private _name: string;
  private _chainId: string;
  private _contractsPath: string;
  private _contracts: Contracts;
  private _deployments: Deployments;
  private _chainRegistry: ChainRegistry;
  private _workspaceRoot: string;
  private _configPath: string;

  /**
   * @param name - Name of the project
   * @param chainId - Active/selected chain id in the project
   * @param contractsPath - Path of the contract files in the project
   * @param contracts - Instance of {@link Contracts} of the project
   * @param deployments - Instance of {@link Deployments} of the project
   * @param chainRegistry - Instance of {@link ChainRegistry} of the project
   * @param workspaceRoot - Absolute path of the project's workspace root
   * @param configPath - Absolute path of the project's config file
   */
  // eslint-disable-next-line max-params
  constructor(
    name: string,
    chainId: string,
    contractsPath: string,
    contracts: Contracts,
    deployments: Deployments,
    chainRegistry: ChainRegistry,
    workspaceRoot: string,
    configPath: string
  ) {
    this._name = name;
    this._chainId = chainId;
    this._contractsPath = contractsPath;
    this._contracts = contracts;
    this._deployments = deployments;
    this._chainRegistry = chainRegistry;
    this._workspaceRoot = workspaceRoot;
    this._configPath = configPath;
  }

  get name(): string {
    return this._name;
  }

  get chainId(): string {
    return this._chainId;
  }

  get workspaceRoot(): string {
    return this._workspaceRoot;
  }

  get contractsPath(): string {
    return this._contractsPath;
  }

  get contractsInstance(): Contracts {
    return this._contracts;
  }

  get deploymentsInstance(): Deployments {
    return this._deployments;
  }

  get chainRegistry(): ChainRegistry {
    return this._chainRegistry;
  }

  get contracts(): Contract[] {
    return this._contracts.listContracts();
  }

  get deployments(): DeploymentWithChain[] {
    return this._deployments.listDeployments();
  }

  /**
   * Initializes a {@link Config} instance, by receiving a {@link ConfigData} object
   *
   * @param data - {@link ConfigData} representation of a config file
   * @param workingDir - Optional - Path of the working directory
   * @returns Promise containing an instance of {@link Config}
   */
  static async init(data: ConfigData, workingDir?: string): Promise<Config> {
    const workspaceRoot = await getWorkspaceRoot(workingDir);
    const configPath = await this.getFilePath(workingDir);
    const deployments = await Deployments.open(workingDir);
    const contracts = await Contracts.open(workingDir, data.contractsPath);
    const chainRegistry = await ChainRegistry.init(workingDir);

    return new Config(
      data.name,
      data.chainId,
      data.contractsPath || DEFAULT.ContractsRelativePath,
      contracts,
      deployments,
      chainRegistry,
      workspaceRoot,
      configPath
    );
  }

  /**
   * Verify if the config file exists
   *
   * @param workingDir - Optional - Path of the working directory
   * @returns Promise containing boolean
   */
  static async exists(workingDir?: string): Promise<boolean> {
    const configPath = await this.getFilePath(workingDir);
    try {
      await fs.access(configPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Open the config file in the project
   *
   * @param workingDir - Optional - Path of the working directory
   * @returns Promise containing an instance of {@link Config}
   */
  static async open(workingDir?: string): Promise<Config> {
    const configPath = await this.getFilePath(workingDir);
    const data: ConfigData = JSON.parse(await fs.readFile(configPath, 'utf8'));

    this.assertIsValidConfigData(data, configPath);

    return Config.init(data);
  }

  /**
   * Creates a config file if it doesn't exist
   *
   * @param chainId - Chain id that will be the default chain in the project
   * @param workingDir - Optional - Path of the working directory
   * @returns Promise containing an instance of {@link Config}
   */
  static async create(chainId: string, workingDir?: string): Promise<Config> {
    if (await Config.exists(workingDir)) {
      throw new AlreadyExistsError('Config file', DEFAULT.ConfigFileName);
    }

    // Get Workspace root
    const directory = await getWorkspaceRoot(workingDir);
    // Get name of Workspace root directory
    const name = sanitizeDirName(path.basename(directory));

    // Create config file
    const configFile = await Config.init(
      {
        name,
        chainId,
      },
      directory
    );
    await configFile.write();

    return configFile;
  }

  /**
   * Get the absolute path of the config file
   *
   * @param workingDir - Optional - Path of the working directory
   * @returns Promise containing the absolute path of the config file
   */
  static async getFilePath(workingDir?: string): Promise<string> {
    const workspaceRoot = await getWorkspaceRoot(workingDir);

    return path.join(workspaceRoot, DEFAULT.ConfigFileName);
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
   * Returns the attributes of {@link Config} as {@link ConfigData}
   *
   * @param data - Object instance to validate
   * @returns Boolean, whether it is valid or not
   */
  toConfigData = (): ConfigData => {
    return { name: this._name, chainId: this._chainId, contractsPath: this._contractsPath } as ConfigData;
  };

  /**
   * Write the data of the {@link Config} instance into the config file
   *
   * @returns Empty promise
   */
  async write(): Promise<void> {
    const json = JSON.stringify(this.toConfigData(), null, 2);
    await writeFileWithDir(this._configPath, json);
  }

  /**
   * Updates the data of the {@link Config} instance, overwriting the passed values
   *
   * @param newData - Partial object of {@link ConfigData} that will be updated
   * @param writeAfterUpdate - Optional - Allows the function to write to the file after updating the object's data
   * @param arrayMergeMode - Optional - Different merge modes, can be OVERWRITE, APPEND, or PREPEND
   */
  async update(newData: Partial<ConfigData>, writeAfterUpdate = false, arrayMergeMode = MergeMode.OVERWRITE): Promise<void> {
    const mergeResult = _.mergeWith(this.toConfigData(), newData, mergeCustomizer(arrayMergeMode));

    this._name = mergeResult.name;
    this._chainId = mergeResult.chainId;
    this._contractsPath = mergeResult.contractsPath;

    if (writeAfterUpdate) {
      await this.write();
    }
  }

  /**
   * Get the chain info of the currently active chain in the project
   *
   * @returns Promise containing the {@link CosmosChain} data
   */
  async activeChainInfo(): Promise<CosmosChain> {
    const result = this._chainRegistry.getChainById(this._chainId);

    if (!result) throw new NotFoundError("Chain in the project's configuration", this._chainId);

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

    if (!auxInfo.apis?.rpc?.[0]?.address) throw new NotFoundError('Rpc endpoint for chain', this._chainId);

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
   * Get a Stargate client of the currently active chain in the project
   *
   * @returns Promise containing the {@link StargateClient}
   */
  async getSigningArchwayClient(account: AccountWithMnemonic): Promise<SigningArchwayClient> {
    const chainInfo = await this.activeChainInfo();
    const rpcEndpoint = await this.activeChainRpcEndpoint(chainInfo);

    const offlineSigner = await DirectSecp256k1HdWallet.fromMnemonic(account!.mnemonic, { prefix: ACCOUNTS.AddressBech32Prefix });
    const gasPrice = GasPrice.fromString(`${DEFAULT.GasPriceAmount}${chainInfo?.fees?.fee_tokens?.[0]?.denom || DEFAULT.GasPriceDenom}`);

    return SigningArchwayClient.connectWithSigner(rpcEndpoint, offlineSigner, {
      gasPrice,
    });
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
      contractsStatus = `\n\n${await this.contractsInstance.prettyPrint()}`;
    }

    return `${bold('Project: ')}${this._name}\n${bold('Selected chain: ')}${this._chainId}` + contractsStatus;
  }

  /**
   * Get an object representation of the config file data + the contracts data
   *
   * @returns Instance of {@link ConfigDataWithContracts}
   */
  async dataWithContracts(): Promise<ConfigDataWithContracts> {
    return {
      ...this.toConfigData(),
      contracts: this.contractsInstance.listContracts(),
    };
  }
}
