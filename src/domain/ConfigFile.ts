import { ConfigData, ConfigDataWithContracts } from '../types/ConfigData';
import fs from 'node:fs/promises';
import path from 'node:path';
import _ from 'lodash';
import { getWokspaceRoot } from '../utils/paths';
import { MergeMode } from '../types/utils';
import { mergeCustomizer } from '../utils';
import { DEFAULT } from '../config';
import { bold } from '../utils/style';
import { Contracts } from './Contracts';
import { FileAlreadyExistsError } from '../exceptions';
import { writeFileWithDir } from '../utils/filesystem';

export class ConfigFile {
  private _data: ConfigData;
  private _path: string;

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

  static async init(data: ConfigData): Promise<ConfigFile> {
    const configData = _.defaultsDeep(data, { contractsPath: DEFAULT.ContractsRelativePath });
    const configPath = await this.getFilePath();
    return new ConfigFile(configData, configPath);
  }

  static async exists(): Promise<boolean> {
    const configPath = await this.getFilePath();
    try {
      await fs.access(configPath);
      return true;
    } catch {
      return false;
    }
  }

  static async open(): Promise<ConfigFile> {
    const configPath = await this.getFilePath();
    const data: ConfigData = JSON.parse(await fs.readFile(configPath, 'utf8'));

    return new ConfigFile(data, configPath);
  }

  static async create(chainId: string): Promise<ConfigFile> {
    if (await ConfigFile.exists()) {
      throw new Error((new FileAlreadyExistsError(DEFAULT.ConfigFileName)).toConsoleString());
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

  static async getFilePath(): Promise<string> {
    const workspaceRoot = await getWokspaceRoot();

    return path.join(workspaceRoot, DEFAULT.ConfigFileName);
  }

  async write(): Promise<void> {
    const json = JSON.stringify(this._data, null, 2);
    await writeFileWithDir(this._path, json);
  }

  async update(newData: Partial<ConfigData>, writeAfterUpdate = false, arrayMergeMode = MergeMode.OVERWRITE): Promise<void> {
    _.mergeWith(this.data, newData, mergeCustomizer(arrayMergeMode));

    if (writeAfterUpdate) {
      await this.write();
    }
  }

  async prettyPrint(withContracts = true): Promise<string> {
    let contractsStatus = '';

    if (withContracts) {
      const contracts = await Contracts.open(this._data.contractsPath);
      contractsStatus = `\n\n${await contracts.prettyPrint()}`;
    }

    return `${bold('Project: ')}${this._data.name}\n${bold('Selected chain: ')}${this._data.chainId}` + contractsStatus;
  }

  async dataWithContracts(): Promise<ConfigDataWithContracts> {
    const contracts = await Contracts.open(this._data.contractsPath);

    return {
      ...this._data,
      contracts: contracts.data,
    };
  }
}
