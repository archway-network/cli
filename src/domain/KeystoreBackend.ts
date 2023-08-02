import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { toBase64 } from '@cosmjs/encoding';

import { Ledger } from '@/domain';
import { ACCOUNTS } from '@/GlobalConfig';
import { AlreadyExistsError, NotFoundError } from '@/exceptions';

import { Account, AccountBase, AccountType } from '@/types';

/**
 * Abstract definition to be used on different KeystoreBackend implementations
 */
export abstract class KeystoreBackend {
  /**
   * Adds a new account to the keyring, if mnemonic is not passed, it generates one
   *
   * @param name - Name of the new account
   * @param type - ${@link AccountType} of the new account
   * @param mnemonic - Optional - Mnemonic of the account
   * @returns Promise containing the newly created account data
   */
  abstract add(name: string, type: AccountType, mnemonic?: string): Promise<Account>;

  /**
   * Get a list of the accounts in the keystore, only getting their basic info
   * @returns Promise containing an array with all the accounts in the keystore
   */
  abstract listNameAndAddress(): Promise<AccountBase[]>;

  /**
   * Get a single account by name or address, including mnemonic
   *
   * @param nameOrAddress - Account name or account address to search by
   * @returns Promise containing the account's data, or undefined if it doesn't exist
   */
  abstract get(nameOrAddress: string): Promise<Account | undefined>;

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
        type: found.type,
      };

      found = undefined;

      return result;
    }
  }

  /**
   * Create a new {@link Account}, can be from ledger, or from mnemonic
   *
   * @param name - Account name
   * @param type - {@link AccountType} value
   * @param mnemonic - Optional - Existing {@link Account} to be validated
   * @param prefix - Optional - Bech 32 prefix for the generated address, defaults to 'archway'
   * @returns Promise containing the {@link Account}
   */
  protected async createAccountObject(
    name: string,
    type: AccountType,
    mnemonic?: string,
    prefix = ACCOUNTS.AddressBech32Prefix
  ): Promise<Account> {
    let result: Account;

    if (type === AccountType.LEDGER) {
      result = await Ledger.getAccount(name);
    } else {
      const wallet = await (mnemonic ?
        DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix }) :
        DirectSecp256k1HdWallet.generate(24, { prefix }));

      const newAccount = (await wallet.getAccounts())[0];

      result = {
        name,
        address: newAccount.address,
        publicKey: {
          '@type': newAccount.algo,
          key: toBase64(newAccount.pubkey),
        },
        type: AccountType.LOCAL,
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
   * Get the account tag by name or address, if account not found throws an error
   *
   * @param nameOrAddress - Account name or address to search by
   * @param suffix - Optional - Suffix at the end of the tag
   * @returns Promise containing the entry tag found
   */
  protected async findAccountTag(nameOrAddress: string, suffix = ACCOUNTS.EntrySuffix): Promise<string> {
    const account = await this.assertAccountExists(nameOrAddress);

    return this.createEntryTag(account.name, account.type, account.address, suffix);
  }

  /**
   * Create an account's keyring entry tag based on the name and address
   *
   * @param name - Name to be used in the tag
   * @param type - {@link AccountType} to be used in the tag
   * @param address - Address to be used in the tag
   * @param suffix - Optional - Suffix at the end of the tag
   * @returns Tag with base64 encoded name and address, with an identifying suffix
   */
  protected createEntryTag(name: string, type: AccountType, address: string, suffix = ACCOUNTS.EntrySuffix): string {
    return `${name}${ACCOUNTS.EntrySeparator}${type}${ACCOUNTS.EntrySeparator}${address}.${suffix}`;
  }

  /**
   * Convert a keyring entry tag into a {@link AccountBase}
   *
   * @param tag - Tag with suffix
   * @param suffix - Optional - Suffix at the end of the tag
   * @returns Instance of {@link AccountBase} with the name and address, or undefined if invalid tag
   */
  protected parseEntryTag(tag: string, suffix = ACCOUNTS.EntrySuffix): AccountBase | undefined {
    try {
      // Validate suffix
      const splitBySuffix = tag.split('.');

      if (splitBySuffix.length !== 2 || splitBySuffix[1] !== suffix) return undefined;

      const splitAccountBase = splitBySuffix[0].split(ACCOUNTS.EntrySeparator);

      if (splitAccountBase.length !== 3) return undefined;

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
