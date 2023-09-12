import path from 'node:path';

import keyring from '@archwayhq/keyring-go';

import { KeystoreBackend } from '@/domain/KeystoreBackend';
import { InvalidPasswordError } from '@/exceptions';
import { Prompts } from '@/services';

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
   * {@inheritDoc KeystoreBackend.save}
   */
  protected async save(name: string, tag: string, data: string): Promise<void> {
    const password = await this.promptPassword(name);
    keyring.FileStore.set(this.filesPath, tag, data, password);
  }

  /**
   * {@inheritDoc KeystoreBackend.getFromStorage}
   */
  protected async getFromStorage(nameOrAddress: string): Promise<string> {
    const tag = await this.findAccountTag(nameOrAddress);
    const password = await this.promptPassword(nameOrAddress);

    try {
      return keyring.FileStore.get(this.filesPath, tag, password);
    } catch (error: Error | any) {
      if (error?.message?.includes?.('aes.KeyUnwrap(): integrity check failed')) {
        throw new InvalidPasswordError();
      }

      throw error;
    }
  }

  /**
   * {@inheritDoc KeystoreBackend.listFromStorage}
   */
  protected listFromStorage(): readonly string[] {
    try {
      return keyring.FileStore.list(this.filesPath);
    } catch {
      return [];
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
