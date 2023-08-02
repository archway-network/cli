import ow from 'ow';

import { Coin, coinValidator } from './Coin';

/**
 * Deployment file information
 */
export interface DeploymentFile {
  deployments: Deployment[];
}

/**
 * Deployment information
 */
export interface Deployment {
  action: DeploymentAction;
  txhash: string;
  wasm: Wasm;
  contract: DeploymentContract;
  metadata?: Metadata;
  msg?: any;
  flatFee?: Coin;
}

/**
 * Wasm contract information
 */
export interface Wasm {
  codeId: number;
  checksum?: string;
}

/**
 * Deployment Contract information
 */
export interface DeploymentContract {
  name: string;
  version: string;
  address?: string;
  admin?: string;
}

/**
 * Contract metadata information
 */
export interface Metadata {
  ownerAddress: string;
  rewardsAddress: string;
}

/**
 * Deployment action types
 */
export enum DeploymentAction {
  STORE = 'store',
  INSTANTIATE = 'instantiate',
  METADATA = 'metadata',
  PREMIUM = 'premium',
}

/**
 * Format validator for the {@link Wasm} interface
 */
export const wasmValidator = ow.object.exactShape({
  codeId: ow.number,
  checksum: ow.optional.string,
});

/**
 * Format validator for the {@link DeploymentContract} interface
 */
export const deploymentContractValidator = ow.object.exactShape({
  name: ow.string,
  version: ow.string,
  address: ow.optional.string,
  admin: ow.optional.string,
});

/**
 * Format validator for the {@link Metadata} interface
 */
export const metadataValidator = ow.optional.object.exactShape({
  ownerAddress: ow.string,
  rewardsAddress: ow.string,
});

/**
 * Format validator for the {@link Deployment} interface
 */
export const deploymentValidator = ow.object.exactShape({
  action: ow.string.oneOf(Object.values(DeploymentAction)),
  txhash: ow.string,
  wasm: wasmValidator,
  contract: deploymentContractValidator,
  metadata: metadataValidator,
  msg: ow.optional.object,
  flatFee: coinValidator,
});

/**
 * Format validator for the {@link DeploymentFile} interface
 */
export const deploymentFileValidator = ow.object.exactShape({
  deployments: ow.array.ofType(deploymentValidator),
});
