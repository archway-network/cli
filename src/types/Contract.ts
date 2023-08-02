import { CargoProjectMetadata } from './Cargo';
import { DeploymentWithChain } from './Deployment';

/**
 * Contract information
 */
export interface Contract extends CargoProjectMetadata {
  deployments: DeploymentWithChain[];
}
