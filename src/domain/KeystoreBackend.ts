import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';

import { NotFoundError } from '@/exceptions';
import {
  Account,
  AccountBase,
  AccountType,
  ExtendedHdPath,
  KeystoreBackendType,
  assertIsValidAccount
} from '@/types';
import { derivePrivateKey } from '@/utils';

const ENTRY_SUFFIX = 'account';
const ENTRY_TAG_SEPARATOR = '<-_>';

/**
 * Params to be used when creating an instance of the Accounts domain that will be used in the keyring
 */
export interface KeystoreBackendParams {
  backend: KeystoreBackendType,
  serviceName?: string;
  filesPath?: string;
}

/**
 * Abstract definition to be used on different KeystoreBackend implementations
 */
export abstract class KeystoreBackend {
  abstract entrySuffix: string;

  /**
   * Adds a new account to the keyring
   *
   * @param account - The account to be added
   * @returns Promise containing the newly stored account
   */
  public async add<T extends AccountBase>(account: T): Promise<T> {
    assertIsValidAccount(account, account.name);

    const tag = this.createEntryTag(account);
    const data = JSON.stringify(account);

    this.save(account.name, tag, data);

    return account;
  }

  /**
   * Saves an account to the keyring
   *
   * @param name - Name of the account
   * @param tag - Tag to be used to save the account
   * @param data - Data to be saved
   */
  protected abstract save(name: string, tag: string, data: string): Promise<void>;

  /**
   * Get a single account by name or address
   *
   * @param nameOrAddress - Account name or account address to search by
   * @returns Promise containing the account's data, or undefined if it doesn't exist
   */
  async get(nameOrAddress: string): Promise<Account | undefined> {
    const stored = await this.getFromStorage(nameOrAddress);
    if (!stored) {
      return;
    }

    const { mnemonic, ...account } = JSON.parse(stored);

    // Convert old version alpha.1 account style to use private key instead. Remove on v2.0.0 release.
    if (mnemonic) {
      // TODO: Use password on file storage
      const deserialized = await DirectSecp256k1HdWallet.deserialize(mnemonic, account.address);
      const hdPath = ExtendedHdPath.Default;
      const privateKey = await derivePrivateKey(deserialized.mnemonic, hdPath.value);
      const convertedAccount: Account = { ...account, privateKey, };

      this.add(convertedAccount);

      return this.get(nameOrAddress);
    }

    return account;
  }

  /**
   * Get an account's data from the key storage
   *
   * @param nameOrAddress - Account name or account address to search by
   */
  protected abstract getFromStorage(nameOrAddress: string): Promise<string>;

  /**
   * Get a list of the accounts in the keystore, only getting their basic info
   * @returns Promise containing an array with all the accounts in the keystore
   */
  async listNameAndAddress(): Promise<readonly AccountBase[]> {
    const result = this.listFromStorage()
      .map((item: string) => this.parseEntryTag(item))
      .filter((item: AccountBase | undefined): item is AccountBase => Boolean(item));

    return result;
  }

  /**
   * Get a list of the accounts in the keystore
   * @returns Promise containing an array with all the accounts in the keystore
   */
  async list(): Promise<readonly Account[]> {
    const result: Account[] = [];
    const baseAccounts = await this.listNameAndAddress();

    for (const item of baseAccounts) {
      // Making the await happen inside the loop so the user does not see
      // a lot of OS password inputs popup at the same time, but one by one
      /* eslint-disable no-await-in-loop */
      const auxAccount = await this.get(item.address);
      if (auxAccount) {
        result.push(auxAccount)
      }
    }

    return result;
  }

  /**
   * Get a list of the accounts in the keystore
   * @returns An array with all the accounts in the keystore
   */
  protected abstract listFromStorage(): readonly string[];

  /**
   * Remove an account by name or address
   *
   * @param nameOrAddress - Account name or account address to remove by
   * @returns Empty promise
   */
  abstract remove(nameOrAddress: string): Promise<void>;

  /**
   * Check if an account exists by name or address, if not found throws an error
   *
   * @param nameOrAddress - Account name or address to search by
   * @returns Instance of {@link AccountBase} with the found account name and address
   */
  async assertAccountExists(nameOrAddress: string): Promise<AccountBase> {
    const result = await this.findNameAndAddressInList(nameOrAddress);
    if (!result) {
      throw new NotFoundError('Account', nameOrAddress)
    }

    return result;
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
   * Get the account tag by name or address, if account not found throws an error
   *
   * @param nameOrAddress - Account name or address to search by
   * @param suffix - Optional - Suffix at the end of the tag
   * @returns Promise containing the entry tag found
   */
  protected async findAccountTag(nameOrAddress: string, suffix: string = ENTRY_SUFFIX): Promise<string> {
    const account = await this.assertAccountExists(nameOrAddress);
    return this.createEntryTag(account, suffix);
  }

  /**
   * Create an account's keyring entry tag based on the name and address
   *
   * @param account - Account to be used in the tag
   * @param suffix - Optional - Suffix at the end of the tag
   * @returns Tag with base64 encoded name and address, with an identifying suffix
   */
  protected createEntryTag(account: AccountBase, suffix: string = ENTRY_SUFFIX): string {
    const { name, type, address } = account;
    return `${name}${ENTRY_TAG_SEPARATOR}${type}${ENTRY_TAG_SEPARATOR}${address}.${suffix}`;
  }

  /**
   * Convert a keyring entry tag into a {@link AccountBase}
   *
   * @param tag - Tag with suffix
   * @param suffix - Optional - Suffix at the end of the tag
   * @returns Instance of {@link AccountBase} with the name and address, or undefined if invalid tag
   */
  protected parseEntryTag(tag: string, suffix = ENTRY_SUFFIX): AccountBase | undefined {
    try {
      // Validate suffix
      const splitBySuffix = tag.split('.');
      if (splitBySuffix.length !== 2 || splitBySuffix[1] !== suffix) {
        return undefined
      }

      const splitAccountBase = splitBySuffix[0].split(ENTRY_TAG_SEPARATOR);
      if (splitAccountBase.length !== 3) {
        return undefined
      }

      return {
        name: splitAccountBase[0],
        type: splitAccountBase[1] as AccountType,
        address: splitAccountBase[2],
      };
    } catch {
      return undefined;
    }
  }
}
