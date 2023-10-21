/* eslint-disable @typescript-eslint/naming-convention */
import ow from 'ow';

import { Contract, KeystoreBackendType } from '@/types';

/**
 * Config data information
 */
export interface ConfigData {
  'chain-id'?: string;
  'contracts-path'?: string;
  'default-account'?: string;
  'keyring-backend'?: KeystoreBackendType;
  'keyring-path'?: string;
}

/**
 * Config data with contracts data for displaying purposes
 */
export interface ConfigDataWithContracts extends ConfigData {
  contracts: readonly Contract[];
}

/**
 * Format validator for the {@link ConfigData} interface
 */
export const configDataValidator = ow.object.exactShape({
  'chain-id': ow.optional.string,
  'contracts-path': ow.optional.string,
  'keyring-backend': ow.optional.string.oneOf(Object.values(KeystoreBackendType)),
  'keyring-path': ow.optional.string,
  'default-account': ow.optional.string,
});
