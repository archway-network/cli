import keyring from '@archwayhq/keyring-go';
import path from 'node:path';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';

import { Accounts, TEST_ENTRY_SUFFIX } from './Accounts';
import { KeystoreBackend } from './KeystoreBackend';

import { Account, AccountBase, AccountType, AccountWithSigner } from '@/types';

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

    return {
      ...account,
      mnemonic: account.mnemonic && (await DirectSecp256k1HdWallet.deserialize(account.mnemonic, account.address)).mnemonic,
    };
  }

  /**
   * {@inheritDoc KeystoreBackend.listNameAndAddress}
   */
  async listNameAndAddress(): Promise<AccountBase[]> {
    let found: string[];

    try {
      found = keyring.UnencryptedFileStore.list(this.filesPath);
    } catch {
      found = [];
    }

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
  async getWithSigner(nameOrAddress: string): Promise<AccountWithSigner | undefined> {
    const tag = await this.findAccountTag(nameOrAddress, TEST_ENTRY_SUFFIX);
    let stored = '';

    try {
      stored = keyring.UnencryptedFileStore.get(this.filesPath, tag);
    } catch {}

    if (stored) {
      const result = JSON.parse(stored);

      Accounts.assertIsValidAccountWithMnemonic(result);

      const signer =
        result.type === AccountType.LEDGER ? undefined : await DirectSecp256k1HdWallet.deserialize(result.mnemonic, result.address);

      return {
        account: result,
        signer,
      };
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
