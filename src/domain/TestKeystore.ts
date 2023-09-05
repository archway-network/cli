import keyring from '@archwayhq/keyring-go';
import path from 'node:path';
import { DirectSecp256k1HdWallet, DirectSecp256k1Wallet } from '@cosmjs/proto-signing';
import { fromBase64 } from '@cosmjs/encoding';
import { HdPath } from '@cosmjs/crypto';

import { DEFAULT_ADDRESS_BECH_32_PREFIX, TEST_ENTRY_SUFFIX } from './Accounts';
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
  async add(name: string, type: AccountType, mnemonicOrPrivateKey?: string, hdPath?: HdPath): Promise<Account> {
    const account = await this.createAccountObject(name, type, mnemonicOrPrivateKey, hdPath);

    keyring.UnencryptedFileStore.set(
      this.filesPath,
      this.createEntryTag(account.name, account.type, account.address, TEST_ENTRY_SUFFIX),
      JSON.stringify({ ...account, mnemonic: undefined }, undefined, 2)
    );

    return account;
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
   * {@inheritDoc KeystoreBackend.getWithSigner}
   */
  async getWithSigner(nameOrAddress: string, prefix = DEFAULT_ADDRESS_BECH_32_PREFIX): Promise<AccountWithSigner | undefined> {
    const tag = await this.findAccountTag(nameOrAddress, TEST_ENTRY_SUFFIX);
    let stored = '';

    try {
      stored = keyring.UnencryptedFileStore.get(this.filesPath, tag);
    } catch {}

    if (stored) {
      let result = JSON.parse(stored);

      if (this.isValidAccountWithMnemonic(result)) {
        // Use private key instead of mnemonic (transition from alpha.1 to alpha.2)
        const deserialized = await DirectSecp256k1HdWallet.deserialize(result.mnemonic, result.address);
        const privateKey = await this.convertMnemonicToPrivateKey(deserialized.mnemonic);

        result = {
          ...result,
          mnemonic: undefined,
          privateKey,
        };

        keyring.OsStore.set(this.filesPath, tag, JSON.stringify(result));
      }

      this.assertIsValidAccountWithPrivateKey(result);

      const signer =
        result.type === AccountType.LEDGER ? undefined : await DirectSecp256k1Wallet.fromKey(fromBase64(result.privateKey), prefix);

      return {
        account: {...result, mnemonic: undefined, privateKey: undefined},
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
