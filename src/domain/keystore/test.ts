import fs from 'node:fs';
import path from 'node:path';

import keyring from '@archwayhq/keyring-go';

import { KeystoreBackendType } from '@/types';
import { GLOBAL_CONFIG_PATH } from '../Config';
import { KeystoreBackend, KeystoreOptions } from './backend';

const DEFAULT_KEY_FILES_PATH = `${GLOBAL_CONFIG_PATH}/keys/test`;

/**
 * Implementation of a unencrypted file based keystore for testing purposes
 */
export class TestBackend implements KeystoreBackend {
  public type: KeystoreBackendType = KeystoreBackendType.file;

  private filesPath: string;

  /**
   * @param filesPath - Path where the account data files will be stored
   */
  constructor(filesPath: string = DEFAULT_KEY_FILES_PATH) {
    this.filesPath = path.resolve(filesPath);

    if (!fs.existsSync(this.filesPath)) {
      fs.mkdirSync(this.filesPath);
    }
  }

  save(tag: string, data: string, _options: KeystoreOptions): void {
    keyring.UnencryptedFileStore.set(this.filesPath, tag, data);
  }

  get(tag: string, _options: KeystoreOptions): string | undefined {
    return keyring.UnencryptedFileStore.get(this.filesPath, tag);
  }

  list(): readonly string[] {
    try {
      return keyring.UnencryptedFileStore.list(this.filesPath);
    } catch {
      return [];
    }
  }

  remove(tag: string): void {
    keyring.UnencryptedFileStore.remove(this.filesPath, tag);
  }
}
