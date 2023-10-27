import fs from 'node:fs';
import path from 'node:path';

import keyring from '@archwayhq/keyring-go';

import { InvalidPasswordError } from '@/exceptions';
import { KeystoreBackendType } from '@/types';

import { KeystoreActionOptions, KeystoreBackend } from './backend';

/**
 * Implementation of an encrypted file based keystore
 */
export class FileBackend implements KeystoreBackend {
  public type: KeystoreBackendType = KeystoreBackendType.file;

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

  save(tag: string, data: string, options?: KeystoreActionOptions): void {
    keyring.FileStore.set(this.filesPath, tag, data, options?.password);
  }

  get(tag: string, options?: KeystoreActionOptions): string | undefined {
    try {
      return keyring.FileStore.get(this.filesPath, tag, options?.password) || undefined;
    } catch (error: Error | any) {
      if (error?.message?.includes?.('aes.KeyUnwrap(): integrity check failed')) {
        throw new InvalidPasswordError();
      }

      throw error;
    }
  }

  list(): readonly string[] {
    try {
      return keyring.FileStore.list(this.filesPath);
    } catch {
      return [];
    }
  }

  remove(tag: string): void {
    keyring.FileStore.remove(this.filesPath, tag);
  }
}
