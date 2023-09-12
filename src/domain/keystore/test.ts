
import keyring from '@archwayhq/keyring-go';

import { KeystoreBackendType } from '@/types';
import { KeystoreActionOptions } from './backend';
import { FileBackend } from './file';

/**
 * Implementation of a unencrypted file based keystore for testing purposes
 */
export class TestBackend extends FileBackend {
  public type: KeystoreBackendType = KeystoreBackendType.file;
  public tagSuffix = 'test';

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
