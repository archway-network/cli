import { CargoProjectMetadata, DeploymentWithChain } from '@/types';

/**
 * Contract information
 */
export interface Contract extends CargoProjectMetadata {
  deployments: DeploymentWithChain[];
}

/**
 * Options for the instantiate-permission flag
 */
export enum InstantiatePermission {
  'any-of' = 'ACCESS_TYPE_ANY_OF_ADDRESSES',
  'everybody' = 'ACCESS_TYPE_EVERYBODY',
  'nobody' = 'ACCESS_TYPE_NOBODY',
}
