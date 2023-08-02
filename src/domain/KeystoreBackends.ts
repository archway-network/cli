import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import keyring from '@archwayhq/keyring-go';
import path from 'node:path';

import { ACCOUNTS } from '@/config';
import { AlreadyExistsError, InvalidPasswordError, NotFoundError } from '@/exceptions';
import { getAccountPasswordPrompt } from '@/services/Prompts';
import { showPrompt } from '@/ui/Prompt';
import { Accounts } from './Accounts';

import { AccountBase, AccountWithMnemonic } from '@/types/Account';

/**
 * Abstract definition to be used on different KeystoreBackend implementations
 */
export abstract class KeystoreBackend {
  /**
   * Adds a new account to the keyring
   *
   * @param name - Name of the new account
   * @param data - Optional - {@link AccountWithMnemonic} to be added to the keyring
   * @returns Promise containing the newly created account data
   */
  abstract add(name: string, data?: AccountWithMnemonic): Promise<AccountWithMnemonic>;

  /**
   * Get a list of the accounts in the keystore
   * @returns Promise containing an array with all the accounts in the keystore
   */
  abstract list(): Promise<AccountBase[]>;

  /**
   * Get a single account by name or address
   *
   * @param nameOrAddress - Account name or account address to search by
   * @returns Promise containing the account's data, or undefined if it doesn't exist
   */
  abstract get(nameOrAddress: string): Promise<AccountWithMnemonic | undefined>;

  /**
   * Delete an account by name or address
   *
   * @param nameOrAddress - Account name or account address to delete by
   * @returns Empty promise
   */
  abstract delete(nameOrAddress: string): Promise<void>;

  /**
   * Create a new {@link AccountWithMnemonic}, or validate an existing one, checking that it doesn't already exist
   *
   * @param name - Account name
   * @param account - Optional - Existing {@link AccountWithMnemonic} to be validated
   * @returns Promise containing the {@link AccountWithMnemonic}
   */
  protected async createAccountObject(name: string, account?: AccountWithMnemonic): Promise<AccountWithMnemonic> {
    let result = account;

    // If parameter with object already received, validate it
    if (result) {
      Accounts.assertIsValidAccountWithMnemonic(account);
    } else {
      // Create a brand new account, generating a mnemonic
      const wallet = await DirectSecp256k1HdWallet.generate(24, { prefix: 'archway' });
      const newAccount = (await wallet.getAccounts())[0];

      result = {
        name,
        address: newAccount.address,
        publicKey: {
          '@type': newAccount.algo,
          key: newAccount.pubkey.toString(),
        },
        mnemonic: wallet.mnemonic,
      };
    }

    await this.assertAccountDoesNotExist(result.name);
    await this.assertAccountDoesNotExist(result.address);

    return result;
  }

  /**
   * Check if an account exists by name or address, if not found throws an error
   *
   * @param nameOrAddress - Account name or address to search by
   * @param suffix - Optional - Suffix at the end of the tag
   * @returns Promise containing the entry tag found
   */
  protected async assertAccountExists(nameOrAddress: string, suffix = ACCOUNTS.EntrySuffix): Promise<string> {
    const result = await this.findEntryTagInList(nameOrAddress, suffix);

    if (!result) throw new NotFoundError('Account', nameOrAddress);

    return result;
  }

  /**
   * Check if an account doesn't exist by name or address, if it exists throws an error
   *
   * @param nameOrAddress - Account name or address to search by
   * @param suffix - Optional - Suffix at the end of the tag
   * @returns Empty promise
   */
  protected async assertAccountDoesNotExist(nameOrAddress: string, suffix = ACCOUNTS.EntrySuffix): Promise<void> {
    if (await this.findEntryTagInList(nameOrAddress, suffix)) throw new AlreadyExistsError('Account', nameOrAddress);
  }

  /**
   * Search an account entry in the list by name or address
   *
   * @param nameOrAddress - Account name or address to search by
   * @param suffix - Optional - Suffix at the end of the tag
   * @returns Promise containing the entry tag or undefined if not found
   */
  protected async findEntryTagInList(nameOrAddress: string, suffix = ACCOUNTS.EntrySuffix): Promise<string | undefined> {
    const list = await this.list();

    for (const item of list) {
      if (item.name === nameOrAddress || item.address === nameOrAddress) {
        return this.createEntryTag(item.name, item.address, suffix);
      }
    }
  }

  /**
   * Create a keyring entry tag based on the address
   *
   * @param address - Name to be used in the tag
   * @param address - Address to be used in the tag
   * @param suffix - Optional - Suffix at the end of the tag
   * @returns Tag with base64 encoded name and address, with an identifying suffix
   */
  protected createEntryTag(name: string, address: string, suffix = ACCOUNTS.EntrySuffix): string {
    return `${name}${ACCOUNTS.EntrySeparator}${address}.${suffix}`;
  }

  /**
   * Convert a keyring entry tag into {@link AccountBase}
   *
   * @param tag - Tag with suffix
   * @param suffix - Optional - Suffix at the end of the tag
   * @returns Instance of {@link AccountBase} with the name and address, or undefined if invalid tag
   */
  protected parseEntryTag(tag: string, suffix = ACCOUNTS.EntrySuffix): AccountBase | undefined {
    try {
      // Validate suffix
      const separateSuffix = tag.split('.');
      if (separateSuffix.length !== 2 || separateSuffix[1] !== suffix) return undefined;

      const separateName = separateSuffix[0].split(ACCOUNTS.EntrySeparator);

      if (separateName.length !== 2) return undefined;

      return {
        name: separateName[0],
        address: separateName[1],
      };
    } catch {
      return undefined;
    }
  }
}

/**
 * Implementation of an OS based keystore
 */
export class OsKeystore extends KeystoreBackend {
  /**
   * @param serviceName - Service name to group the account entries in the OS keystore
   */
  constructor(private serviceName: string) {
    super();
  }

  /**
   * {@inheritDoc KeystoreBackend.add}
   */
  async add(name: string, data?: AccountWithMnemonic): Promise<AccountWithMnemonic> {
    const account = await this.createAccountObject(name, data);

    keyring.OsStore.set(this.serviceName, this.createEntryTag(account.name, account.address), JSON.stringify(account));

    return account;
  }

  /**
   * {@inheritDoc KeystoreBackend.list}
   */
  async list(): Promise<AccountBase[]> {
    const found: string[] = keyring.OsStore.list(this.serviceName);
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
  async get(nameOrAddress: string): Promise<AccountWithMnemonic | undefined> {
    const tag = await this.assertAccountExists(nameOrAddress);
    let stored = '';

    try {
      stored = keyring.OsStore.get(this.serviceName, tag);
    } catch (error: Error | any) {
      if (error?.message?.includes?.('Keyring backend access denied by user')) throw new InvalidPasswordError();
    }

    if (stored) {
      const result = JSON.parse(stored);
      Accounts.assertIsValidAccountWithMnemonic(result);

      return result;
    }
  }

  /**
   * {@inheritDoc KeystoreBackend.delete}
   */
  async delete(nameOrAddress: string): Promise<void> {
    const tag = await this.assertAccountExists(nameOrAddress);

    keyring.OsKeystore.remove(this.serviceName, tag);
  }
}

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
  async add(name: string, data?: AccountWithMnemonic): Promise<AccountWithMnemonic> {
    const password = await this.promptPassword(name);
    const account = await this.createAccountObject(name, data);

    keyring.FileStore.set(this.filesPath, this.createEntryTag(account.name, account.address), JSON.stringify(account), password);

    return account;
  }

  /**
   * {@inheritDoc KeystoreBackend.list}
   */
  async list(): Promise<AccountBase[]> {
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
  async get(nameOrAddress: string): Promise<AccountWithMnemonic | undefined> {
    const password = await this.promptPassword(nameOrAddress);
    const tag = await this.assertAccountExists(nameOrAddress);
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
   * {@inheritDoc KeystoreBackend.delete}
   */
  async delete(nameOrAddress: string): Promise<void> {
    const tag = await this.assertAccountExists(nameOrAddress);

    keyring.FileStore.remove(this.filesPath, tag);
  }

  /**
   * Prompt the user to enter a password to be used with the encrypted file
   *
   * @param nameOrAddress - Name or address of the account to be displayed in the prompt
   * @returns Promise containing the password entered by the user
   */
  async promptPassword(nameOrAddress: string): Promise<string> {
    const chainPrompt = await getAccountPasswordPrompt(nameOrAddress);
    const response = await showPrompt(chainPrompt);

    return response.password || '';
  }
}

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
  async add(name: string, data?: AccountWithMnemonic): Promise<AccountWithMnemonic> {
    const account = await this.createAccountObject(name, data);

    keyring.UnencryptedFileStore.set(
      this.filesPath,
      this.createEntryTag(account.name, account.address),
      JSON.stringify(account, undefined, 2)
    );

    return account;
  }

  /**
   * {@inheritDoc KeystoreBackend.list}
   */
  async list(): Promise<AccountBase[]> {
    const found: string[] = keyring.UnencryptedFileStore.list(this.filesPath);
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
  async get(nameOrAddress: string): Promise<AccountWithMnemonic | undefined> {
    const tag = await this.assertAccountExists(nameOrAddress);
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
   * {@inheritDoc KeystoreBackend.delete}
   */
  async delete(nameOrAddress: string): Promise<void> {
    const tag = await this.assertAccountExists(nameOrAddress);

    keyring.UnencryptedFileStore.remove(this.filesPath, tag);
  }
}
