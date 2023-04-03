import { DefaultDeploymentsRelativePath } from '../config';
import { DeploymentFile } from '../types/Deployment';
import path from 'node:path';
import fs from 'node:fs/promises';
import { getWokspaceRoot } from '../utils/paths';

export class DeploymentsByChain {
  private _chainId: string;
  private _data: DeploymentFile;

  constructor(chainId: string, data: DeploymentFile) {
    this._chainId = chainId;
    this._data = data;
  }

  get chainId(): string {
    return this._chainId;
  }

  get data(): DeploymentFile {
    return this._data;
  }

  static async open(chainId: string): Promise<DeploymentsByChain> {
    const configPath = await this.getFilePath(chainId);
    const data: DeploymentFile = JSON.parse(await fs.readFile(configPath, 'utf8'));

    return new DeploymentsByChain(chainId, data);
  }

  static async getFilePath(chainId: string): Promise<string> {
    const workspaceRoot = await getWokspaceRoot();

    return path.join(workspaceRoot, DefaultDeploymentsRelativePath, `./${chainId}.json`);
  }
}
