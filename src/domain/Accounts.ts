import ow from 'ow';

import { InvalidFormatError } from '@/exceptions';
import { KeystoreBackend, OsKeystore } from './KeystoreBackends';
import { ACCOUNTS } from '@/config';

import { AccountWithMnemonic, BackendType, PublicKey, accountWithMnemonicValidator } from '@/types/Account';
import { bold } from '@/utils/style';
import { parsePublicKey } from '@/utils/accounts';

/**
 * Params to be used when creating an instance of {@link Accounts} that will be used in the keyring
 */
export interface AccountsParams {
  serviceName?: string;
  filesPath?: string;
}

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

  static prettyPrintPublicKey(publicKey: PublicKey): string {
    return `${bold('Public Key')}\n  ${bold('Type:')} ${publicKey['@type']}\n  ${bold('Key:')} ${parsePublicKey(publicKey.key)}`;
  }

  /**
   * Create a new account in the keyring
   *
   * @param name - Account name
   * @returns Promise containing an instance of {@link AccountWithMnemonic}
   */
  async new(name: string): Promise<AccountWithMnemonic> {
    const result = await this._keystore.add(name);

    return result;
  }
}
