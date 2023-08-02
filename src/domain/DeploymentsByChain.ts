import ow from 'ow';
import fs from 'node:fs/promises';
import path from 'node:path';
import _ from 'lodash';

import { prettyPrintTransaction, writeFileWithDir, blue, bold, green } from '@/utils';
import { InvalidFormatError } from '@/exceptions';

import { DeploymentAction, Deployment, DeploymentFile, deploymentValidator } from '@/types';

/**
 * Manage the deployments of a specific chain, represented in a deployment file by chain id
 */
export class DeploymentsByChain {
  private _chainId: string;
  private _data: DeploymentFile;
  private _path: string;

  /**
   * @param chainId - Chain id of the chain where the deployments belong
   * @param data - Instance of {@link DeploymentFile} that contains the related deployments
   * @param path - Absolute path of the deployments file for this chain
   */
  constructor(chainId: string, data: DeploymentFile, path: string) {
    this._chainId = chainId;
    this._data = data;
    this._path = path;
  }

  get chainId(): string {
    return this._chainId;
  }

  get data(): DeploymentFile {
    return this._data;
  }

  get path(): string {
    return this._path;
  }

  /**
   * Initializes a {@link DeploymentsByChain} instance, by receiving the chain id, deployments and path
   *
   * @param deploymentsPath - Path to the directory containing the deployments data
   * @param chainId - Chain id of the deployment
   * @param deployments - Array of {@link Deployment}
   * @returns Instance of {@link DeploymentsByChain}
   */
  static init(deploymentsPath: string, chainId: string, deployments: Deployment[]): DeploymentsByChain {
    const path = this.getFilePath(deploymentsPath, chainId);

    return new DeploymentsByChain(chainId, { deployments }, path);
  }

  /**
   * Reads a deployments file, finding it by its chain id
   *
   * @param deploymentsPath - Path to the directory containing the deployments data
   * @param chainId - Chain id of the deployment
   * @returns Promise containing an instance of {@link DeploymentsByChain}
   */
  static async open(deploymentsPath: string, chainId: string): Promise<DeploymentsByChain> {
    const path = this.getFilePath(deploymentsPath, chainId);
    const data: DeploymentFile = JSON.parse(await fs.readFile(path, 'utf8'));

    this.assertIsValidDeployment(data, path);

    return new DeploymentsByChain(chainId, data, path);
  }

  /**
   * Get the absolute path of a deployment file, by its associated chain id
   *
   * @param deploymentsPath - Path to the directory containing the deployments data
   * @param chainId - Chain id of the deployment
   * @returns Promise containing the absolute path of the deployment file
   */
  static getFilePath(deploymentsPath: string, chainId: string): string {
    return path.join(deploymentsPath, `./${chainId}.json`);
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
   * Add a deployment to the deployments list
   *
   * @param deployment - {@link Deployment} object to write
   */
  registerDeployment(deployment: Deployment): void {
    const withoutChainId = { ...deployment, chainId: undefined };

    // Add to inner data
    this._data.deployments = [withoutChainId, ...this._data.deployments];
  }

  /**
   * Write the deployments data of an instance of this class into a file (creates one if it doesn't exist)
   *
   * @param chain - {@link CosmosChain} object to write
   * @returns Empty promise
   */
  async write(): Promise<void> {
    const jsonData = JSON.stringify(this._data, null, 2);

    await writeFileWithDir(this.path, jsonData);
  }

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
          `\nTransaction: ${prettyPrintTransaction(auxDeploy.txhash, explorerTxUrl)}`;
      }
    }

    return result;
  }
}
