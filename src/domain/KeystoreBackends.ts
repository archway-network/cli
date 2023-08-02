import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import keyring from '@archwayhq/keyring-go';
import path from 'node:path';

import { ACCOUNTS } from '@/GlobalConfig';
import { AlreadyExistsError, InvalidPasswordError, NotFoundError } from '@/exceptions';
import { getAccountPasswordPrompt } from '@/services';
import { showPrompt } from '@/ui';
import { Accounts } from '@/domain';
import { parsePublicKey } from '@/utils';

import { Account, AccountBase, AccountWithMnemonic } from '@/types';

/**
 * Abstract definition to be used on different KeystoreBackend implementations
 */
export abstract class KeystoreBackend {
  /**
   * Adds a new account to the keyring, if mnemonic is not passed, it generates one
   *
   * @param name - Name of the new account
   * @param data - Optional - Mnemonic of the account
   * @returns Promise containing the newly created account data
   */
  abstract add(name: string, mnemonic?: string): Promise<AccountWithMnemonic>;

  /**
   * Get a list of the accounts in the keystore, only by name and address
   * @returns Promise containing an array with all the accounts in the keystore
   */
  abstract listNameAndAddress(): Promise<AccountBase[]>;

  /**
   * Get a single account by name or address, including mnemonic
   *
   * @param nameOrAddress - Account name or account address to search by
   * @returns Promise containing the account's data, or undefined if it doesn't exist
   */
  abstract get(nameOrAddress: string): Promise<AccountWithMnemonic | undefined>;

  /**
   * Remove an account by name or address
   *
   * @param nameOrAddress - Account name or account address to remove by
   * @returns Empty promise
   */
  abstract remove(nameOrAddress: string): Promise<void>;

  /**
   * Get a list of the accounts in the keystore
   * @returns Promise containing an array with all the accounts in the keystore
   */
  async list(): Promise<Account[]> {
    const result: Account[] = [];
    const baseAccounts = await this.listNameAndAddress();

    for (const item of baseAccounts) {
      // Making the await happen inside the loop so the user does not see
      // a lot of OS password inputs popup at the same time, but one by one
      /* eslint-disable no-await-in-loop */
      const auxAccount = await this.getWithoutMnemonic(item.address);

      if (auxAccount) result.push(auxAccount);
    }

    return result;
  }

  /**
   * Get a single account by name or address, without mnemonic
   *
   * @param nameOrAddress - Account name or account address to search by
   * @returns Promise containing the account's data, or undefined if it doesn't exist
   */
  async getWithoutMnemonic(nameOrAddress: string): Promise<Account | undefined> {
    let found = await this.get(nameOrAddress);

    if (found) {
      const result: Account = {
        name: found.name,
        address: found.address,
        publicKey: found.publicKey,
      };

      found = undefined;

      return result;
    }
  }

  /**
   * Create a new {@link AccountWithMnemonic}, or validate an existing one, checking that it doesn't already exist
   *
   * @param name - Account name
   * @param account - Optional - Existing {@link AccountWithMnemonic} to be validated
   * @param prefix - Optional - Bech 32 prefix for the generated address, defaults to 'archway'
   * @returns Promise containing the {@link AccountWithMnemonic}
   */
  protected async createAccountObject(
    name: string,
    mnemonic?: string,
    prefix = ACCOUNTS.AddressBech32Prefix
  ): Promise<AccountWithMnemonic> {
    const wallet = await (mnemonic ?
      DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix }) :
      DirectSecp256k1HdWallet.generate(24, { prefix }));

    const newAccount = (await wallet.getAccounts())[0];

    const result = {
      name,
      address: newAccount.address,
      publicKey: {
        '@type': newAccount.algo,
        key: parsePublicKey(newAccount.pubkey.toString()),
      },
      mnemonic: wallet.mnemonic,
    };

    await this.assertAccountDoesNotExist(result.name);
    await this.assertAccountDoesNotExist(result.address);

    return result;
  }

  /**
   * Check if an account exists by name or address, if not found throws an error
   *
   * @param nameOrAddress - Account name or address to search by
   * @returns Instance of {@link AccountBase} with the found account name and address
   */
  async assertAccountExists(nameOrAddress: string): Promise<AccountBase> {
    const result = await this.findNameAndAddressInList(nameOrAddress);

    if (!result) throw new NotFoundError('Account', nameOrAddress);

    return result;
  }

  /**
   * Check if an account doesn't exist by name or address, if it exists throws an error
   *
   * @param nameOrAddress - Account name or address to search by
   * @returns Empty promise
   */
  async assertAccountDoesNotExist(nameOrAddress: string): Promise<void> {
    if (await this.findNameAndAddressInList(nameOrAddress)) throw new AlreadyExistsError('Account', nameOrAddress);
  }

  /**
   * Search an account entry in the list by name or address
   *
   * @param nameOrAddress - Account name or address to search by
   * @returns Promise containing the name and address, or undefined if not found
   */
  async findNameAndAddressInList(nameOrAddress: string): Promise<AccountBase | undefined> {
    const list = await this.listNameAndAddress();

    for (const item of list) {
      if (item.name === nameOrAddress || item.address === nameOrAddress) {
        return item;
      }
    }
  }

  /**
   * Check if an account exists by name or address, if not found throws an error
   *
   * @param nameOrAddress - Account name or address to search by
   * @param suffix - Optional - Suffix at the end of the tag
   * @returns Promise containing the entry tag found
   */
  protected async findAccountTag(nameOrAddress: string, suffix = ACCOUNTS.EntrySuffix): Promise<string> {
    const account = await this.assertAccountExists(nameOrAddress);

    return this.createEntryTag(account.name, account.address, suffix);
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
  async add(name: string, mnemonic?: string): Promise<AccountWithMnemonic> {
    const account = await this.createAccountObject(name, mnemonic);

    keyring.OsStore.set(this.serviceName, this.createEntryTag(account.name, account.address), JSON.stringify(account));

    return account;
  }

  /**
   * {@inheritDoc KeystoreBackend.listNameAndAddress}
   */
  async listNameAndAddress(): Promise<AccountBase[]> {
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
    const tag = await this.findAccountTag(nameOrAddress);
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
   * {@inheritDoc KeystoreBackend.remove}
   */
  async remove(nameOrAddress: string): Promise<void> {
    const tag = await this.findAccountTag(nameOrAddress);

    keyring.OsStore.remove(this.serviceName, tag);
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
  async add(name: string, mnemonic?: string): Promise<AccountWithMnemonic> {
    const password = await this.promptPassword(name);
    const account = await this.createAccountObject(name, mnemonic);

    keyring.FileStore.set(this.filesPath, this.createEntryTag(account.name, account.address), JSON.stringify(account), password);

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
  async get(nameOrAddress: string): Promise<AccountWithMnemonic | undefined> {
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
  async add(name: string, mnemonic?: string): Promise<AccountWithMnemonic> {
    const account = await this.createAccountObject(name, mnemonic);

    keyring.UnencryptedFileStore.set(
      this.filesPath,
      this.createEntryTag(account.name, account.address, ACCOUNTS.TestEntrySuffix),
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
      const auxAccount = this.parseEntryTag(item, ACCOUNTS.TestEntrySuffix);
      if (auxAccount) result.push(auxAccount);
    }

    return result;
  }

  /**
   * {@inheritDoc KeystoreBackend.get}
   */
  async get(nameOrAddress: string): Promise<AccountWithMnemonic | undefined> {
    const tag = await this.findAccountTag(nameOrAddress, ACCOUNTS.TestEntrySuffix);
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
    const tag = await this.findAccountTag(nameOrAddress, ACCOUNTS.TestEntrySuffix);

    keyring.UnencryptedFileStore.remove(this.filesPath, tag);
  }
}
