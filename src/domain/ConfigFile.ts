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

/**
 * Manages the config file of the project
 */
export class ConfigFile {
  private _data: ConfigData;
  private _path: string;

  /**
   * @param data - {@link ConfigData} representation of the config file
   * @param path - Absolute path of the project's config file
   */
  constructor(data: ConfigData, path: string) {
    this._data = data;
    this._path = path;
  }

  get data(): ConfigData {
    return this._data;
  }

  get path(): string {
    return this._path;
  }

  /**
   * Initializes a {@link ConfigFile} instance, by receiving a {@link ConfigData} object
   *
   * @param data - {@link ConfigData} representation of a config file
   * @returns Promise containing an instance of {@link ConfigFile}
   */
  static async init(data: ConfigData): Promise<ConfigFile> {
    const configData = _.defaultsDeep(data, { contractsPath: DEFAULT.ContractsRelativePath });
    const configPath = await this.getFilePath();
    return new ConfigFile(configData, configPath);
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
   * @returns Promise containing an instance of {@link ConfigFile}
   */
  static async open(): Promise<ConfigFile> {
    const configPath = await this.getFilePath();
    const data: ConfigData = JSON.parse(await fs.readFile(configPath, 'utf8'));

    this.assertIsValidConfigData(data, configPath);

    return new ConfigFile(data, configPath);
  }

  /**
   * Creates a config file if it doesn't exist
   *
   * @param chainId - Chain id that will be the default chain in the project
   * @returns Promise containing an instance of {@link ConfigFile}
   */
  static async create(chainId: string): Promise<ConfigFile> {
    if (await ConfigFile.exists()) {
      throw new FileAlreadyExistsError(DEFAULT.ConfigFileName);
    }

    // Get Workspace root
    const workingDir = await getWokspaceRoot();
    // Get name of Workspace root directory
    const name = path.basename(workingDir).replace(' ', '-');

    // Create config file
    const configFile = await ConfigFile.init({
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
   * Write the data of the {@link ConfigFile} instance into the config file
   *
   * @returns Empty promise
   */
  async write(): Promise<void> {
    const json = JSON.stringify(this._data, null, 2);
    await writeFileWithDir(this._path, json);
  }

  /**
   * Updates the data of the {@link ConfigFile} instance, overwriting the passed values
   *
   * @param newData - Partial object of {@link ConfigData} that will be updated
   * @param writeAfterUpdate - Optional - Allows the function to write to the file after updating the object's data
   * @param arrayMergeMode - Optional - Different merge modes, can be OVERWRITE, APPEND, or PREPEND
   */
  async update(newData: Partial<ConfigData>, writeAfterUpdate = false, arrayMergeMode = MergeMode.OVERWRITE): Promise<void> {
    _.mergeWith(this.data, newData, mergeCustomizer(arrayMergeMode));

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
      const contracts = await Contracts.open(this._data.contractsPath);
      contractsStatus = `\n\n${await contracts.prettyPrint()}`;
    }

    return `${bold('Project: ')}${this._data.name}\n${bold('Selected chain: ')}${this._data.chainId}` + contractsStatus;
  }

  /**
   * Get an object representation of the config file data + the contracts data
   *
   * @returns Instance of {@link ConfigDataWithContracts}
   */
  async dataWithContracts(): Promise<ConfigDataWithContracts> {
    const contracts = await Contracts.open(this._data.contractsPath);

    return {
      ...this._data,
      contracts: contracts.data,
    };
  }
}
