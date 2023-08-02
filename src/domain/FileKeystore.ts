import keyring from '@archwayhq/keyring-go';
import path from 'node:path';

import { InvalidPasswordError } from '@/exceptions';
import { Prompts } from '@/services';
import { Accounts } from '@/domain/Accounts';
import { KeystoreBackend } from '@/domain/KeystoreBackend';

import { Account, AccountBase, AccountType } from '@/types';

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
  async add(name: string, type: AccountType, mnemonic?: string): Promise<Account> {
    const password = await this.promptPassword(name);
    const account = await this.createAccountObject(name, type, mnemonic);

    keyring.FileStore.set(this.filesPath, this.createEntryTag(account.name, account.type, account.address), JSON.stringify(account), password);

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
   * {@inheritDoc KeystoreBackend.get}
   */
  async get(nameOrAddress: string): Promise<Account | undefined> {
    const password = await this.promptPassword(nameOrAddress);
    const tag = await this.findAccountTag(nameOrAddress);
    let stored = '';

    try {
      stored = keyring.FileStore.get(this.filesPath, tag, password);
    } catch (error: Error | any) {
      if (error?.message?.includes?.('aes.KeyUnwrap(): integrity check failed')) throw new InvalidPasswordError();
    }

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

    return promptedPassword?.password || '';
  }
}
