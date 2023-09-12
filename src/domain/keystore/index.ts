import { InvalidFormatError, NotFoundError } from '@/exceptions';
import { Prompts } from '@/services';
import { Account, AccountBase, AccountType, KeystoreBackendType, assertIsValidAccount, assertIsValidAccountBase } from '@/types';

import { fromBase64, toBase64 } from '@cosmjs/encoding';
import { KeystoreActionOptions, KeystoreBackend } from './backend';
import { FileBackend } from './file';
import { OsBackend } from './os';
import { TestBackend } from './test';

const ENTRY_TAG_SEPARATOR = '$';
const ENTRY_TAG_SUFFIX = 'account';
const ENTRY_TAG_ENCODING: BufferEncoding = 'base64';

/**
 * Params to be used when creating an instance of the Accounts domain that will be used in the keyring
 */
export interface KeystoreBackendParams {
  backendType: KeystoreBackendType,
  filesPath: string;
  serviceName?: string;
}

/**
  * Facade to access the underlying keyring backend. This class is responsible for
  * serializing and deserializing the accounts to be stored in the keyring.
  */
export class Keystore {
  constructor(private readonly backend: KeystoreBackend) {
    this.backend = backend;
  }

  public static build(params: KeystoreBackendParams): Keystore {
    const backend = (() => {
      switch (params.backendType) {
        case KeystoreBackendType.os:
          return new OsBackend(params.serviceName);
        case KeystoreBackendType.file:
          return new FileBackend(params.filesPath);
        case KeystoreBackendType.test:
          return new TestBackend(params.filesPath);
      }
    })();

    return new Keystore(backend);
  }

  private async serializeAccount(account: Account): Promise<string> {
    const { publicKey, privateKey } = account;
    const serializedAccount = {
      ...account,
      publicKey: {
        algo: publicKey.algo,
        key: toBase64(publicKey.key)
      },
      privateKey: privateKey ? toBase64(privateKey) : undefined,
    };

    return JSON.stringify(serializedAccount);
  }

  private async deserializeAccount(data: string): Promise<Account> {
    const serializedAccount = JSON.parse(data);
    const { publicKey, privateKey } = serializedAccount;
    const account = {
      ...serializedAccount,
      publicKey: {
        algo: publicKey.algo,
        key: fromBase64(publicKey.key)
      },
      privateKey: privateKey ? fromBase64(privateKey) : undefined,
    };

    return account;
  }

  /**
   * Adds a new account to the keyring
   *
   * @param account - The account to be added
   * @returns Promise containing the newly stored account
   */
  public async save(account: Account): Promise<Account> {
    assertIsValidAccount(account, account.name);

    const tag = this.toEntryTag(account);
    const data = await this.serializeAccount(account);
    const options = await this.buildKeystoreActionOptions(account.name);

    this.backend.save(tag, data, options);

    return account;
  }

  /**
   * Gets a single account by name or address
   *
   * @param nameOrAddress - Account name or account address to search by
   * @returns Promise containing the account's data, or undefined if it doesn't exist
   * @throws {@link InvalidFormatError} if the tag is not in the correct format or the serialized account is not valid
   * @throws {@link NotFoundError} if the account does not exist
   */
  public async get(nameOrAddress: string): Promise<Account> {
    const tag = this.getTag(nameOrAddress);
    return this.getByTag(tag, nameOrAddress);
  }

  private getTag(nameOrAddress: string): string  {
    const [tag] = this.findTag(nameOrAddress) || [];
    if (!tag) {
      throw new NotFoundError('Account', nameOrAddress);
    }

    return tag;
  }

  /**
   * Get a single account by tag
   *
   * @param tag - Tag to get the account by
   * @param nameOrAddress - Account name or account address to search by
   * @returns Promise containing the account's data
   * @throws InvalidFormatError if the tag is not in the correct format or the serialized account is not valid
   */
  private async getByTag(tag: string, nameOrAddress: string): Promise<Account> {
    const options = await this.buildKeystoreActionOptions(nameOrAddress);
    const data = this.backend.get(tag, options);
    if (!data) {
      throw new NotFoundError('Account', tag);
    }

    const account = await this.deserializeAccount(data);
    assertIsValidAccount(account, account.name);

    return account;
  }

  /**
   * Check if an account doesn't exist by name or address
   *
   * @param nameOrAddress - Account name or address to search by
   * @returns If the account exists or not
   */
  public exists(nameOrAddress: string): boolean {
    return this.findTag(nameOrAddress) !== undefined;
  }

  /**
   * Searches for an account base data by name or address
   *
   * @param nameOrAddress - Account name or account address to search by
   * @returns Promise containing the account's base data, or undefined if it doesn't exist
   */
  public findAccountBase(nameOrAddress: string): AccountBase | undefined {
    const [, account] = this.findTag(nameOrAddress) || [];
    return account;
  }

  private findTag(nameOrAddress: string): [string, AccountBase] | undefined {
    const accountWithTags = this.listAccountsWithTags();
    const result = [...accountWithTags]
      .find(([_, { name, address }]) => name === nameOrAddress || address === nameOrAddress);

    return result;
  }

  private listAccountsWithTags(): ReadonlyMap<string, AccountBase> {
    const tags = this.backend.list();
    const accountsWithTags: Array<[string, AccountBase] | null> = tags.map(tag => {
      // try {
      const account = this.fromEntryTag(tag);
      return [tag, account];
      // } catch {}

      // return null;
    });

    return new Map(
      accountsWithTags.filter((accountWithTags): accountWithTags is [string, AccountBase] => accountWithTags !== null)
    );
  }

  /**
   * Get a list of the accounts in the keystore, only getting their basic info
   *
   * @returns Promise containing an array with all the accounts in the keystore
   */
  public listNameAndAddress(): readonly AccountBase[] {
    const accountsWithTags = this.listAccountsWithTags();
    return [...accountsWithTags.values()];
  }

  /**
   * Get a list of the accounts in the keystore
   *
   * @returns Promise containing an array with all the accounts in the keystore
   */
  public async list(): Promise<readonly Account[]> {
    const accounts: Account[] = [];

    for (const [tag, { name }] of this.listAccountsWithTags()) {
      // Await inside the loop so the user does not see a lot of
      // OS password inputs popup at the same time, but one by one
      // eslint-disable-next-line no-await-in-loop
      const account = await this.getByTag(tag, name);
      accounts.push(account);
    }

    return accounts;
  }

  /**
   * Remove an account from the keyring
   *
   * @param nameOrAddress - Account name or address to search by
   */
  public remove(nameOrAddress: string): void {
    const tag = this.getTag(nameOrAddress);
    this.backend.remove(tag);
  }

  /**
   * Create an account's keyring entry tag based on the name and address
   *
   * @param account - Account to be used in the tag
   * @returns Tag with hex encoded name and address
   */
  private toEntryTag({ name, type, address }: AccountBase): string {
    const tag = [name, type, address].join(ENTRY_TAG_SEPARATOR);
    const hexEncodedTag = Buffer.from(tag).toString(ENTRY_TAG_ENCODING);
    return `${hexEncodedTag}.${ENTRY_TAG_SUFFIX}`;
  }

  /**
   * Create an account's keyring entry tag based on the name and address
   *
   * @param account - Account to be used in the tag
   * @returns Tag with hex encoded name and address
   * @throws InvalidFormatError if the tag is not in the correct format
   */
  private fromEntryTag(tag: string): AccountBase {
    const ENTRY_TAG_REGEX = new RegExp(`^[\\da-f]+\\.${ENTRY_TAG_SUFFIX}$`);
    if (!ENTRY_TAG_REGEX.test(tag)) {
      throw new InvalidFormatError(`Tag ${tag}`);
    }

    const [encodedTag] = tag.split('.');
    const decoded = Buffer.from(encodedTag, ENTRY_TAG_ENCODING).toString();
    const [name, type, address] = decoded.split(ENTRY_TAG_SEPARATOR);

    const account = {
      name,
      type: type as AccountType,
      address
    };
    assertIsValidAccountBase(account, account.name);

    return account;
  }

  private async buildKeystoreActionOptions(nameOrAddress: string): Promise<KeystoreActionOptions | undefined> {
    if (this.backend.type === KeystoreBackendType.file) {
      const password = await this.promptPassword(nameOrAddress);
      return { password };
    }
  }

  /**
   * Prompt the user to enter a password to be used with the encrypted file
   *
   * @param nameOrAddress - Name or address of the account to be displayed in the prompt
   * @returns Promise containing the password entered by the user
   */
  private async promptPassword(nameOrAddress: string): Promise<string> {
    const promptedPassword = await Prompts.accountPassword(nameOrAddress);
    return promptedPassword || '';
  }
}
