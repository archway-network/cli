import { ConfigData } from '../types/Config/ConfigData';
import fs from 'node:fs/promises';
import path from 'node:path';
import _ from 'lodash';

export const DefaultConfigFileName = 'modulor.json';
export const DefaultContractsPath = './contracts';

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

  static init(data: ConfigData, workspaceRoot = './'): ConfigFile {
    const configData = _.defaultsDeep(data, { contractPaths: DefaultContractsPath });
    const configPath = this.getFilePath(workspaceRoot);
    return new ConfigFile(configData, configPath);
  }

  async write(): Promise<void> {
    const json = JSON.stringify(this._data, null, 2);
    await fs.writeFile(this._path, json);
  }

  static async exists(workspaceRoot = './'): Promise<boolean> {
    const configPath = this.getFilePath(workspaceRoot);
    try {
      await fs.access(configPath);
      return true;
    } catch {
      return false;
    }
  }

  static async open(workspaceRoot = './'): Promise<ConfigFile> {
    const configPath = this.getFilePath(workspaceRoot);
    await fs.access(configPath);
    const data: ConfigData = await import(configPath);

    return new ConfigFile(data, configPath);
  }

  static getFilePath(workspaceRoot = './'): string {
    return path.join(workspaceRoot, DefaultConfigFileName);
  }
}
