import keyring from '@archwayhq/keyring-go';
import path from 'node:path';
import { DirectSecp256k1HdWallet, DirectSecp256k1Wallet } from '@cosmjs/proto-signing';
import { fromBase64 } from '@cosmjs/encoding';
import { HdPath } from '@cosmjs/crypto';

import { InvalidPasswordError } from '@/exceptions';
import { Prompts } from '@/services';
import { DEFAULT_ADDRESS_BECH_32_PREFIX } from '@/domain/Accounts';
import { KeystoreBackend } from '@/domain/KeystoreBackend';

import { Account, AccountBase, AccountType, AccountWithSigner } from '@/types';

/**
 * Implementation of an encrypted file based keystore
 */
export class FileKeystore extends KeystoreBackend {
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
    const password = await this.promptPassword(name);
    const account = await this.createAccountObject(name, type, mnemonicOrPrivateKey, hdPath);

    keyring.FileStore.set(
      this.filesPath,
      this.createEntryTag(account.name, account.type, account.address),
      JSON.stringify({ ...account, mnemonic: undefined }),
      password
    );

    return account;
  }

  /**
   * {@inheritDoc KeystoreBackend.listNameAndAddress}
   */
  async listNameAndAddress(): Promise<AccountBase[]> {
    const found: string[] = keyring.FileStore.list(this.filesPath);
    const result: AccountBase[] = [];

    for (const item of found) {
      const auxAccount = this.parseEntryTag(item);
      if (auxAccount) result.push(auxAccount);
    }

    return result;
  }

  /**
   * {@inheritDoc KeystoreBackend.getWithSigner}
   */
  async getWithSigner(nameOrAddress: string, prefix = DEFAULT_ADDRESS_BECH_32_PREFIX): Promise<AccountWithSigner | undefined> {
    const password = await this.promptPassword(nameOrAddress);
    const tag = await this.findAccountTag(nameOrAddress);
    let stored = '';

    try {
      stored = keyring.FileStore.get(this.filesPath, tag, password);
    } catch (error: Error | any) {
      if (error?.message?.includes?.('aes.KeyUnwrap(): integrity check failed')) throw new InvalidPasswordError();
    }

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
        account: { ...result, mnemonic: undefined, privateKey: undefined },
        signer,
      };
    }
  }

  /**
   * {@inheritDoc KeystoreBackend.remove}
   */
  async remove(nameOrAddress: string): Promise<void> {
    const tag = await this.findAccountTag(nameOrAddress);

    keyring.FileStore.remove(this.filesPath, tag);
  }

  /**
   * Prompt the user to enter a password to be used with the encrypted file
   *
   * @param nameOrAddress - Name or address of the account to be displayed in the prompt
   * @returns Promise containing the password entered by the user
   */
  async promptPassword(nameOrAddress: string): Promise<string> {
    const promptedPassword = await Prompts.accountPassword(nameOrAddress);

    return promptedPassword || '';
  }
}
