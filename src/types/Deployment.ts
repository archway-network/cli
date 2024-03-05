import { ContractMetadata } from '@archwayhq/arch3.js';
import ow from 'ow';

import { Coin, coinValidator } from '@/types';

/**
 * Deployment file information
 */
export interface DeploymentFile {
  deployments: Deployment[];
}

/**
 * Deployment information with chain id included
 */
export interface DeploymentWithChain extends Deployment {
  chainId?: string;
}

/**
 * Base Deployment information
 */
export interface Deployment {
  action: DeploymentAction;
  contract: BaseContract;
  txhash: string;
  wasm: BaseWasm
}

/**
 * Deployment Contract information
 */
export interface BaseContract {
  name: string;
  version: string;
}

/**
 * Store Deployment information
 */
export interface StoreDeployment extends DeploymentWithChain {
  wasm: StoreWasm;
}

/**
 * Wasm contract information
 */
export interface BaseWasm {
  codeId: number;
}

/**
 * Wasm contract information
 */
export interface StoreWasm extends BaseWasm {
  checksum: string;
}

/**
 * Instantiate Deployment information
 */
export interface InstantiateDeployment extends DeploymentWithChain {
  contract: InstantiatedContract;
  msg: any;
}

/**
 * Instantiate Contract information
 */
export interface InstantiatedContract extends BaseContract {
  address: string;
  admin: string;
}

/**
 * Metadata Deployment information
 */
export interface MetadataDeployment extends DeploymentWithChain {
  contract: InstantiatedContract;
  metadata: ContractMetadata;
}

/**
 * Premium Deployment information
 */
export interface PremiumDeployment extends DeploymentWithChain {
  contract: InstantiatedContract;
  flatFee: Coin;
}

/**
 * Migrate Deployment information
 */
export interface MigrateDeployment extends DeploymentWithChain {
  contract: InstantiatedContract;
  msg: any;
}

/**
 * Deployment action types
 */
export enum DeploymentAction {
  INSTANTIATE = 'instantiate',
  METADATA = 'metadata',
  MIGRATE = 'migrate',
  PREMIUM = 'premium',
  STORE = 'store',
}

/**
 * Format validator for the {@link Wasm} interface
 */
export const wasmValidator = ow.optional.object.exactShape({
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
export const metadataValidator = ow.optional.object.partialShape({
  contractAddress: ow.string,
  ownerAddress: ow.optional.string,
  rewardsAddress: ow.optional.string,
  withdrawToWallet: ow.optional.boolean,
});

/**
 * Format validator for the {@link Deployment} interface
 */
export const deploymentValidator = ow.object.exactShape({
  chainId: ow.optional.string,
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
