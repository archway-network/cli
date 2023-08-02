import { Flags } from '@oclif/core';

import { BackendType } from '@/types/Account';

const KeyringBackendDescription = 'Backend for the keyring';
const KeyringPathDescription = 'File-based keyring path';

/**
 * Keyring Backend flag
 */
export const keyringBackend = Flags.string({
  description: KeyringBackendDescription,
  default: 'os',
  options: Object.values(BackendType),
});

/**
 * Keyring path flag
 */
export const keyringPath = Flags.string({
  description: KeyringPathDescription,
});

/**
 * All of the Keyring related flags
 */
export const KeyringFlags = {
  'keyring-backend': keyringBackend,
  'keyring-path': keyringPath,
};
