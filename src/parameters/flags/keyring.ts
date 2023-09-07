import { Flags } from '@oclif/core';

import { KeystoreBackendType } from '@/types';

const KeyringBackendDescription = 'Backend for the keyring';
const KeyringPathDescription = 'File-based keyring path';

/**
 * Definition of Keyring Backend flag
 */
export const ParamsKeyringBackendFlag = {
  description: KeyringBackendDescription,
  default: KeystoreBackendType.os,
  options: Object.values(KeystoreBackendType),
  parse: async (val: string): Promise<KeystoreBackendType> => val as KeystoreBackendType,
};

/**
 * Keyring Backend flag
 */
export const KeyringBackendFlag = Flags.custom(ParamsKeyringBackendFlag)();

/**
 * Definition of Keyring path flag
 */
export const ParamsKeyringPathFlag = {
  description: KeyringPathDescription,
};

/**
 * Keyring path flag
 */
export const KeyringPathFlag = Flags.string(ParamsKeyringPathFlag);

/**
 * All of the Keyring related flags
 */
export const KeyringFlags = {
  'keyring-backend': KeyringBackendFlag,
  'keyring-path': KeyringPathFlag,
};
