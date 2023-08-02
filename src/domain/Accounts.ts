import ow from 'ow';

import { InvalidFormatError } from '@/exceptions';
import { KeystoreBackend, OsKeystore } from './KeystoreBackends';
import { ACCOUNTS } from '@/config';
import { bold } from '@/utils/style';

import { AccountBase, AccountWithMnemonic, AccountsParams, BackendType, PublicKey, accountWithMnemonicValidator } from '@/types/Account';
import { parsePublicKey } from '@/utils/accounts';

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
   * @returns Promise containing an instance of {@link AccountWithMnemonic}
   */
  async new(name: string): Promise<AccountWithMnemonic> {
    const result = await this._keystore.add(name);

    result.publicKey.key = parsePublicKey(result.publicKey.key);

    return result;
  }
}
