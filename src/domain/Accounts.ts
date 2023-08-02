import ow from 'ow';
import { Coin, StargateClient } from '@cosmjs/stargate';

import { InvalidFormatError, NotFoundError } from '@/exceptions';
import { KeystoreBackend, OsKeystore } from '@/domain';
import { ACCOUNTS } from '@/GlobalConfig';
import { assertIsValidAddress, bold } from '@/utils';

import {
  Account,
  AccountBalancesJSON,
  AccountBase,
  AccountWithMnemonic,
  AccountsParams,
  BackendType,
  PublicKey,
  accountWithMnemonicValidator,
} from '@/types';

/**
 * Accounts manager
 */
export class Accounts {
  private _keystore: KeystoreBackend;

  /**
   * @param keystore - Keystore backend that will keep the account's data
   */
  constructor(keystore: KeystoreBackend) {
    this._keystore = keystore;
  }

  get keystore(): KeystoreBackend {
    return this._keystore;
  }

  /**
   * Loads all the available keys
   *
   * @param customKeysPath - Optional - Additional path to check for key files
   * @returns Promise containing an instance of {@link Accounts}
   */
  static async init(type: BackendType, params?: AccountsParams): Promise<Accounts> {
    let keystore: KeystoreBackend;
    switch (type) {
      case BackendType.os:
        keystore = new OsKeystore(params?.serviceName || ACCOUNTS.SecretServiceName);
        break;
      case BackendType.file:
        keystore = new OsKeystore(params?.filesPath || ACCOUNTS.KeyFilesPath);
        break;
      case BackendType.test:
        keystore = new OsKeystore(params?.filesPath || ACCOUNTS.KeyFilesPath);
        break;
    }

    return new Accounts(keystore);
  }

  /**
   * Verify if an object has the valid format of a {@link AccountWithMnemonic}, throws error if not
   *
   * @param data - Object instance to validate
   * @param name - Optional - Name of the account, will be used in the possible error
   * @returns void
   */
  static assertIsValidAccountWithMnemonic = (data: unknown, name?: string): void => {
    if (!this.isValidAccountWithMnemonic(data)) throw new InvalidFormatError(name || 'Account');
  };

  /**
   * Verify if an object has the valid format of a {@link AccountWithMnemonic}
   *
   * @param data - Object instance to validate
   * @returns Boolean, whether it is valid or not
   */
  static isValidAccountWithMnemonic = (data: unknown): boolean => {
    return ow.isValid(data, accountWithMnemonicValidator);
  };

  /**
   * Get a formatted version of the public key
   *
   * @param publicKey - Instance of {@link PublicKey} to be printed
   * @returns Pretty formatted string
   */
  static prettyPrintPublicKey(publicKey: PublicKey): string {
    return `${bold('Public Key')}\n  ${bold('Type:')} ${publicKey['@type']}\n  ${bold('Key:')} ${publicKey.key}`;
  }

  /**
   * Get a formatted version of the name and address
   *
   * @param publicKey - Instance of {@link AccountBase} to be printed
   * @returns Pretty formatted string
   */
  static prettyPrintNameAndAddress(account: AccountBase): string {
    return `${bold('Name:')} ${account.name}\n${bold('Address:')} ${account.address}`;
  }

  /**
   * Create a new account in the keyring
   *
   * @param name - Account name
   * @param mnemonic - Optional - 24 word mnemonic to use in the new account
   * @returns Promise containing an instance of {@link AccountWithMnemonic}
   */
  async new(name: string, mnemonic?: string): Promise<AccountWithMnemonic> {
    return this._keystore.add(name, mnemonic);
  }

  /**
   * Get a single account by name or address, without mnemonic, throws error if not found
   *
   * @param nameOrAddress - Account name or account address to search by
   * @returns Promise containing an instance of {@link Account}
   */
  async get(nameOrAddress: string): Promise<Account> {
    const account = await this.keystore.getWithoutMnemonic(nameOrAddress);

    if (!account) throw new NotFoundError('Account', nameOrAddress);

    return account;
  }

  /**
   * Get a single account by name or address with mnemonic, throws error if not found
   *
   * @param nameOrAddress - Account name or account address to search by
   * @returns Promise containing an instance of {@link AccountWithMnemonic}
   */
  async getWithMnemonic(nameOrAddress: string): Promise<AccountWithMnemonic> {
    const account = await this.keystore.get(nameOrAddress);

    if (!account) throw new NotFoundError('Account', nameOrAddress);

    return account;
  }

  /**
   * Get a list of the accounts in the keystore
   * @returns Promise containing an array with all the accounts in the keystore
   */
  async list(): Promise<Account[]> {
    return this.keystore.list();
  }

  /**
   * Get a list of the accounts in the keystore, only by name and address
   * @returns Promise containing an array with all the accounts in the keystore
   */
  async listNameAndAddress(): Promise<AccountBase[]> {
    return this.keystore.listNameAndAddress();
  }

  /**
   * Remove an account by name or address
   *
   * @param nameOrAddress - Account name or account address to remove by
   * @returns Empty promise
   */
  async remove(nameOrAddress: string): Promise<void> {
    return this.keystore.remove(nameOrAddress);
  }

  /**
   * Query the balance of an account
   *
   * @param client - Stargate client to use when querying
   * @param nameOrAddress - Account name or account address to search by
   * @returns Promise containing the balances result
   */
  async queryBalance(client: StargateClient, nameOrAddress: string): Promise<AccountBalancesJSON> {
    const accountInfo = await this.keystore.assertAccountExists(nameOrAddress);

    const balances = await client.getAllBalances(accountInfo.address);

    return {
      account: {
        name: accountInfo.name,
        address: accountInfo.address,
        balances: balances as Coin[],
      },
    };
  }

  /**
   * Create an instance of {@link AccountBase} from an address, getting the name if found in keyring
   *
   * @param address - Account address to search by
   * @returns Promise containing an instance of {@link AccountBase}
   */
  async accountBaseFromAddress(address: string): Promise<AccountBase> {
    const found = await this.keystore.findNameAndAddressInList(address);

    if (!found) assertIsValidAddress(address, ACCOUNTS.AddressBech32Prefix);

    return {
      name: found?.name || '',
      address: found?.address || address,
    };
  }
}
