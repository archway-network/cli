import fs from 'node:fs';
import path from 'node:path';

import keyring from '@archwayhq/keyring-go';

import { InvalidPasswordError } from '@/exceptions';
import { KeystoreBackendType } from '@/types';
import { GLOBAL_CONFIG_PATH } from '../Config';
import { KeystoreBackend, KeystoreOptions } from './backend';

const DEFAULT_KEY_FILES_PATH = `${GLOBAL_CONFIG_PATH}/keys`;

/**
 * Implementation of an encrypted file based keystore
 */
export class FileBackend implements KeystoreBackend {
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

  save(tag: string, data: string, options?: KeystoreOptions): void {
    keyring.FileStore.set(this.filesPath, tag, data, options?.password);
  }

  get(tag: string, options?: KeystoreOptions): string | undefined {
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
