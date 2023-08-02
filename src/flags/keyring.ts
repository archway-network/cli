import { Flags } from '@oclif/core';

import { BackendType } from '@/types/Account';

const KeyringBackendDescription = 'Backend for the keyring';
const KeyringPathDescription = 'File-based keyring path';

/**
 * Definition of Keyring Backend flag
 */
export const definitionKeyringBackend = {
  description: KeyringBackendDescription,
  default: 'os',
  options: Object.values(BackendType),
};

/**
 * Keyring Backend flag
 */
export const keyringBackend = Flags.string(definitionKeyringBackend);

/**
 * Definition of Keyring path flag
 */
export const definitionKeyringPath = {
  description: KeyringPathDescription,
};

/**
 * Keyring path flag
 */
export const keyringPath = Flags.string(definitionKeyringPath);

/**
 * All of the Keyring related flags
 */
export const KeyringFlags = {
  'keyring-backend': keyringBackend,
  'keyring-path': keyringPath,
};
