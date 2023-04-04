import { DEFAULT } from '../config';
import { Deployment, DeploymentAction, DeploymentFile } from '../types/Deployment';
import path from 'node:path';
import fs from 'node:fs/promises';
import { getWokspaceRoot } from '../utils/paths';
import { blue, bold, green } from '../utils/style';
import _ from 'lodash';
import terminalLink from 'terminal-link';

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

  static init(chainId: string, deployments: Deployment[]): DeploymentsByChain {
    return new DeploymentsByChain(chainId, { deployments });
  }

  static async open(chainId: string): Promise<DeploymentsByChain> {
    const configPath = await this.getFilePath(chainId);
    const data: DeploymentFile = JSON.parse(await fs.readFile(configPath, 'utf8'));

    return new DeploymentsByChain(chainId, data);
  }

  static async getFilePath(chainId: string): Promise<string> {
    const workspaceRoot = await getWokspaceRoot();

    return path.join(workspaceRoot, DEFAULT.DeploymentsRelativePath, `./${chainId}.json`);
  }

  prettyPrint(explorerTxUrl?: string): string {
    // Group by deployments of same contract name and version
    const mappedVersions: Record<string, Deployment[]> = {};

    for (const item of this._data.deployments) {
      const id = `${item.contract.name}-${item.contract.version}`;
      if (mappedVersions[id]?.length) {
        mappedVersions[id].push(item);
      } else {
        mappedVersions[id] = [item];
      }
    }

    let result = `Deployments on ${blue(this._chainId)}`;
    // Loop through deployments of a contract version
    for (const version of Object.values(mappedVersions)) {
      result += `\n\n${green(version[0].contract.name)} (${version[0].contract.version})`;
      for (const auxDeploy of version) {
        result +=
          `\n\n${bold(_.capitalize(auxDeploy.action))}` +
          (auxDeploy.action === DeploymentAction.STORE ?
            `\nCode ID: ${auxDeploy.wasm.codeId}` :
            `\nContract: ${auxDeploy.contract.address}`) +
          (auxDeploy.action === DeploymentAction.PREMIUM ? `\nFlat fee: ${auxDeploy.flatFee?.amount}${auxDeploy.flatFee?.denom}` : '') +
          (auxDeploy.action === DeploymentAction.METADATA ?
            `\nOwner address: ${auxDeploy.metadata?.ownerAddress}\nRewards address: ${auxDeploy.metadata?.rewardsAddress}` :
            '') +
          (auxDeploy.action === DeploymentAction.INSTANTIATE ? `\nAdmin: ${auxDeploy.contract.admin}` : '') +
          `\nTransaction: ${this.prettyPrintTransaction(auxDeploy.txhash, explorerTxUrl)}`;
      }
    }

    return result;
  }

  private prettyPrintTransaction(txHash: string, explorerTxUrl?: string): string {
    if (!explorerTxUrl) {
      return txHash;
    }

    const txUrl = explorerTxUrl.replace(/(\${txHash})/, txHash.trim());

    return blue(terminalLink(txHash, txUrl, { fallback: () => txUrl }));
  }
}
