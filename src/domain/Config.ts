import fs from 'node:fs/promises';
import path from 'node:path';
import _ from 'lodash';
import ow from 'ow';

import { ConfigData, ConfigDataWithContracts, configDataValidator } from '@/types/ConfigData';
import { getWokspaceRoot } from '@/utils/paths';
import { MergeMode } from '@/types/utils';
import { mergeCustomizer } from '@/utils';
import { DEFAULT } from '@/config';
import { bold } from '@/utils/style';
import { Contracts } from './Contracts';
import { FileAlreadyExistsError } from '@/exceptions';
import { writeFileWithDir } from '@/utils/filesystem';
import { InvalidFormatError } from '@/exceptions';
import { Deployment } from '@/types/Deployment';
import { Contract } from '@/types/Contract';
import { Deployments } from './Deployments';

/**
 * Manages the config file of the project and creates instances of ChainRegistry, Deployments and Contracts
 */
export class Config {
  private _name: string;
  private _chainId: string;
  private _contractsPath: string;
  private _contracts: Contracts;
  private _deployments: Deployments;
  private _configPath: string;

  /**
   * @param name - Name of the project
   * @param chainId - Active/selected chain id in the project
   * @param contractsPath - Absolute path of the contract files in the project
   * @param contracts - Array containing all the contracts
   * @param deployments - Array containing all the deployments
   * @param configPath - Absolute path of the project's config file
   */
  // eslint-disable-next-line max-params
  constructor(name: string, chainId: string, contractsPath: string, contracts: Contracts, deployments: Deployments, configPath: string) {
    this._name = name;
    this._chainId = chainId;
    this._contractsPath = contractsPath;
    this._contracts = contracts;
    this._deployments = deployments;
    this._configPath = configPath;
  }

  get name(): string {
    return this._name;
  }

  get chainId(): string {
    return this._chainId;
  }

  get contractsPath(): string {
    return this._contractsPath;
  }

  get contracts(): Contract[] {
    return this._contracts.listContracts();
  }

  get deployments(): Deployment[] {
    return this._deployments.listDeployments();
  }

  /**
   * Initializes a {@link Config} instance, by receiving a {@link ConfigData} object
   *
   * @param data - {@link ConfigData} representation of a config file
   * @returns Promise containing an instance of {@link Config}
   */
  static async init(data: ConfigData): Promise<Config> {
    const configPath = await this.getFilePath();
    const contracts = await Contracts.open();
    const deployments = await Deployments.open();
    return new Config(
      data.name,
      data.chainId,
      data.contractsPath || DEFAULT.ContractsRelativePath,
      contracts,
      deployments,
      configPath
    );
  }

  /**
   * Verify if the config file exists
   *
   * @returns Promise containing boolean
   */
  static async exists(): Promise<boolean> {
    const configPath = await this.getFilePath();
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
   * @returns Promise containing an instance of {@link Config}
   */
  static async open(): Promise<Config> {
    const configPath = await this.getFilePath();
    const data: ConfigData = JSON.parse(await fs.readFile(configPath, 'utf8'));

    this.assertIsValidConfigData(data, configPath);

    return Config.init(data);
  }

  /**
   * Creates a config file if it doesn't exist
   *
   * @param chainId - Chain id that will be the default chain in the project
   * @returns Promise containing an instance of {@link Config}
   */
  static async create(chainId: string): Promise<Config> {
    if (await Config.exists()) {
      throw new FileAlreadyExistsError(DEFAULT.ConfigFileName);
    }

    // Get Workspace root
    const workingDir = await getWokspaceRoot();
    // Get name of Workspace root directory
    const name = path.basename(workingDir).replace(' ', '-');

    // Create config file
    const configFile = await Config.init({
      name,
      chainId,
    });
    await configFile.write();

    return configFile;
  }

  /**
   * Get the absolute path of the config file
   *
   * @returns Promise containing the absolute path of the config file
   */
  static async getFilePath(): Promise<string> {
    const workspaceRoot = await getWokspaceRoot();

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
      const contracts = await Contracts.open(this._contractsPath);
      contractsStatus = `\n\n${await contracts.prettyPrint()}`;
    }

    return `${bold('Project: ')}${this._name}\n${bold('Selected chain: ')}${this._chainId}` + contractsStatus;
  }

  /**
   * Get an object representation of the config file data + the contracts data
   *
   * @returns Instance of {@link ConfigDataWithContracts}
   */
  async dataWithContracts(): Promise<ConfigDataWithContracts> {
    const contracts = await Contracts.open(this._contractsPath);

    return {
      ...this.toConfigData(),
      contracts: contracts.listContracts(),
    };
  }
}
