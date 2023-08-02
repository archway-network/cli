import ow from 'ow';

import { Contract } from './Contract';

/**
 * Config data information
 */
export interface ConfigData {
  name: string;
  chainId: string;
  contractsPath?: string;
}

/**
 * Config data with contracts data for displaying purposes
 */
export interface ConfigDataWithContracts extends ConfigData {
  contracts: Contract[];
}

/**
 * Format validator for the {@link ConfigData} interface
 */
export const configDataValidator = ow.object.partialShape({
  name: ow.string,
  chainId: ow.string,
  contractsPath: ow.optional.string,
});
