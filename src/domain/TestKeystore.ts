import path from 'node:path';

import keyring from '@archwayhq/keyring-go';

import { AccountBase } from '@/types';

import { KeystoreBackend } from './KeystoreBackend';

export const TEST_ENTRY_SUFFIX = 'test';

/**
 * Implementation of a unencrypted file based keystore for testing purposes
 */
export class TestKeystore extends KeystoreBackend {
  private filesPath: string;

  /**
   * @param filesPath - Path where the account data files will be stored
   */
  constructor(filesPath: string) {
    super();
    this.filesPath = path.resolve(filesPath);
  }

  /**
   * {@inheritDoc KeystoreBackend.save}
   */
  protected async save(_name: string, tag: string, data: string): Promise<void> {
    keyring.UnencryptedFileStore.set(this.filesPath, tag, data);
  }

  /**
   * {@inheritDoc KeystoreBackend.getFromStorage}
   */
  protected async getFromStorage(nameOrAddress: string): Promise<string> {
    const tag = await this.findAccountTag(nameOrAddress, TEST_ENTRY_SUFFIX);
    return keyring.UnencryptedFileStore.get(this.filesPath, tag);
  }

  /**
   * {@inheritDoc KeystoreBackend.listFromStorage}
   */
  protected listFromStorage(): readonly string[] {
    try {
      return keyring.UnencryptedFileStore.list(this.filesPath);
    } catch {
      return [];
    }
  }

  /**
   * {@inheritDoc KeystoreBackend.remove}
   */
  async remove(nameOrAddress: string): Promise<void> {
    const tag = await this.findAccountTag(nameOrAddress, TEST_ENTRY_SUFFIX);
    keyring.UnencryptedFileStore.remove(this.filesPath, tag);
  }

  /**
   * {@inheritDoc KeystoreBackend.createEntryTag}
   */
  protected createEntryTag(account: AccountBase, _suffix?: string): string {
    return super.createEntryTag(account, TEST_ENTRY_SUFFIX);
  }
}
