import fs from 'node:fs';
import path from 'node:path';

import keyring from '@archwayhq/keyring-go';

import { KeystoreBackendType } from '@/types';
import { KeystoreActionOptions, KeystoreBackend } from './backend';

/**
 * Implementation of a unencrypted file based keystore for testing purposes
 */
export class TestBackend implements KeystoreBackend {
  public type: KeystoreBackendType = KeystoreBackendType.test;

  protected filesPath: string;

  /**
   * @param filesPath - Path where the account data files will be stored
   */
  constructor(filesPath: string) {
    this.filesPath = path.join(path.resolve(filesPath), this.type);

    if (!fs.existsSync(this.filesPath)) {
      fs.mkdirSync(this.filesPath, { recursive: true });
    }
  }

  save(tag: string, data: string, _options: KeystoreActionOptions): void {
    keyring.UnencryptedFileStore.set(this.filesPath, tag, data);
  }

  get(tag: string, _options: KeystoreActionOptions): string | undefined {
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
