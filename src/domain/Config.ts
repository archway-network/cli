import fs from 'node:fs/promises';
import path from 'node:path';
import _ from 'lodash';
import ow from 'ow';

import { ConfigData, ConfigDataWithContracts, configDataValidator } from '@/types/ConfigData';
import { getWorkspaceRoot } from '@/utils/paths';
import { MergeMode } from '@/types/utils';
import { mergeCustomizer } from '@/utils';
import { DEFAULT } from '@/config';
import { bold } from '@/utils/style';
import { Contracts } from './Contracts';
import { FileAlreadyExistsError } from '@/exceptions';
import { writeFileWithDir } from '@/utils/filesystem';
import { InvalidFormatError } from '@/exceptions';
import { DeploymentWithChain } from '@/types/Deployment';
import { Contract } from '@/types/Contract';
import { Deployments } from './Deployments';
import { sanitizeDirName } from '@/utils/sanitize';

/**
 * Manages the config file of the project and creates instances of ChainRegistry, Deployments and Contracts
 */
export class Config {
  private _name: string;
  private _chainId: string;
  private _contractsPath: string;
  private _contracts: Contracts;
  private _deployments: Deployments;
  private _workspaceRoot: string;
  private _configPath: string;

  /**
   * @param name - Name of the project
   * @param chainId - Active/selected chain id in the project
   * @param contractsPath - Path of the contract files in the project
   * @param contracts - Array containing all the contracts
   * @param deployments - Array containing all the deployments
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
    workspaceRoot: string,
    configPath: string
  ) {
    this._name = name;
    this._chainId = chainId;
    this._contractsPath = contractsPath;
    this._contracts = contracts;
    this._deployments = deployments;
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

    return new Config(
      data.name,
      data.chainId,
      data.contractsPath || DEFAULT.ContractsRelativePath,
      contracts,
      deployments,
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
      throw new FileAlreadyExistsError(DEFAULT.ConfigFileName);
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

    console.log(configFile._contractsPath)
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
