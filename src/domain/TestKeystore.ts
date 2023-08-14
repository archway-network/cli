import keyring from '@archwayhq/keyring-go';
import path from 'node:path';

import { Accounts, TEST_ENTRY_SUFFIX } from '@/domain/Accounts';
import { KeystoreBackend } from '@/domain/KeystoreBackend';

import { Account, AccountBase, AccountType } from '@/types';

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
   * {@inheritDoc KeystoreBackend.add}
   */
  async add(name: string, type: AccountType, mnemonic?: string): Promise<Account> {
    const account = await this.createAccountObject(name, type, mnemonic);

    keyring.UnencryptedFileStore.set(
      this.filesPath,
      this.createEntryTag(account.name, account.type, account.address, TEST_ENTRY_SUFFIX),
      JSON.stringify(account, undefined, 2)
    );

    return account;
  }

  /**
   * {@inheritDoc KeystoreBackend.listNameAndAddress}
   */
  async listNameAndAddress(): Promise<AccountBase[]> {
    const found: string[] = keyring.UnencryptedFileStore.list(this.filesPath);
    const result: AccountBase[] = [];

    for (const item of found) {
      const auxAccount = this.parseEntryTag(item, TEST_ENTRY_SUFFIX);
      if (auxAccount) result.push(auxAccount);
    }

    return result;
  }

  /**
   * {@inheritDoc KeystoreBackend.get}
   */
  async get(nameOrAddress: string): Promise<Account | undefined> {
    const tag = await this.findAccountTag(nameOrAddress, TEST_ENTRY_SUFFIX);
    let stored = '';

    try {
      stored = keyring.UnencryptedFileStore.get(this.filesPath, tag);
    } catch {}

    if (stored) {
      const result = JSON.parse(stored);

      Accounts.assertIsValidAccountWithMnemonic(result);

      return result;
    }
  }

  /**
   * {@inheritDoc KeystoreBackend.remove}
   */
  async remove(nameOrAddress: string): Promise<void> {
    const tag = await this.findAccountTag(nameOrAddress, TEST_ENTRY_SUFFIX);

    keyring.UnencryptedFileStore.remove(this.filesPath, tag);
  }
}
