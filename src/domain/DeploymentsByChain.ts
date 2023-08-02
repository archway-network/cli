import ow from 'ow';
import fs from 'node:fs/promises';
import path from 'node:path';
import _ from 'lodash';
import terminalLink from 'terminal-link';

import { DEFAULT } from '@/config';
import { DeploymentAction, Deployment, DeploymentFile, deploymentValidator } from '@/types/Deployment';
import { getWorkspaceRoot } from '@/utils/paths';
import { blue, bold, green } from '@/utils/style';
import { InvalidFormatError } from '@/exceptions';

/**
 * Manage the deployments of a specific chain, represented in a deployment file by chain id
 */
export class DeploymentsByChain {
  private _chainId: string;
  private _data: DeploymentFile;

  /**
   * @param chainId - Chain id of the chain where the deployments belong
   * @param data - Instance of {@link DeploymentFile} that contains the related deployments
   */
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

  /**
   * Initializes a {@link DeploymentsByChain} instance, by receiving the chain id and deployments
   *
   * @param chainId - Chain id associated with the deployments
   * @param deployments - Array of {@link Deployment}
   * @returns Instance of {@link DeploymentsByChain}
   */
  static init(chainId: string, deployments: Deployment[]): DeploymentsByChain {
    return new DeploymentsByChain(chainId, { deployments });
  }

  /**
   * Reads a deployments file, finding it by its chain id
   *
   * @param chainId - Chain id of the deployment file to be read
   * @returns Promise containing an instance of {@link DeploymentsByChain}
   */
  static async open(chainId: string): Promise<DeploymentsByChain> {
    const configPath = await this.getFilePath(chainId);
    const data: DeploymentFile = JSON.parse(await fs.readFile(configPath, 'utf8'));

    this.assertIsValidDeployment(data, configPath);

    return new DeploymentsByChain(chainId, data);
  }

  /**
   * Get the absolute path of a deployment file, by its associated chain id
   *
   * @param chainId - Chain id of the deployment file
   * @returns Promise containing the absolute path of the deployment file
   */
  static async getFilePath(chainId: string): Promise<string> {
    const workspaceRoot = await getWorkspaceRoot();

    return path.join(workspaceRoot, DEFAULT.DeploymentsRelativePath, `./${chainId}.json`);
  }

  /**
   * Verify if an object has the valid format of a {@link Deployment}, throws error if not
   *
   * @param data - Object instance to validate
   * @param name - Optional - Name of the file, will be used in the possible error
   * @returns void
   */
  static assertIsValidDeployment = (data: unknown, name?: string): void => {
    if (this.isValidDeployment(data)) throw new InvalidFormatError(name || 'Deployment ');
  };

  /**
   * Verify if an object has the valid format of a {@link Deployment}
   *
   * @param data - Object instance to validate
   * @returns Boolean, whether it is valid or not
   */
  static isValidDeployment = (data: unknown): boolean => {
    return ow.isValid(data, deploymentValidator);
  };

  /**
   * Get a formatted version of the deployment file
   *
   * @param explorerTxUrl - Optional - URL of the explorer, that will be used to pretty print a link to the transaction
   * @returns Formatted data of the deployment file, with clickable tx links when available
   */
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
      for (const auxDeploy of version as Array<any>) {
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

  /**
   * Get a formatted version of a transaction, with clickable link when possible
   *
   * @param txHash - Hash of the transaction
   * @param explorerTxUrl - Optional - URL of the explorer, that will be used to pretty print a link to the transaction
   * @returns Transaction hash, with clickable tx link when available
   */
  private prettyPrintTransaction(txHash: string, explorerTxUrl?: string): string {
    if (!explorerTxUrl) {
      return txHash;
    }

    const txUrl = explorerTxUrl.replace(/(\${txHash})/, txHash.trim());

    return blue(terminalLink(txHash, txUrl, { fallback: () => txUrl }));
  }
}
