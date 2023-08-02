import ow from 'ow';

import { Coin } from '@/types';

/**
 * Account base information
 */
export interface AccountBase {
  name: string;
  address: string;
}

/**
 * Account information
 */
export interface Account extends AccountBase {
  publicKey: PublicKey;
}

/**
 * Account with mnemonic information
 */
export interface AccountWithMnemonic extends Account {
  mnemonic: string;
}

/**
 * Account public key information
 */
export interface PublicKey {
  '@type': string;
  key: string;
}

/**
 * Types of backends to be used in the keystore
 */
export enum BackendType {
  test = 'test',
  file = 'file',
  os = 'os',
}

/**
 * Account balances information for json export
 */
export interface AccountBalancesJSON {
  account: {
    name: string;
    address: string;
    balances: Coin[];
  };
}

/**
 * Params to be used when creating an instance of {@link Accounts} that will be used in the keyring
 */
export interface AccountsParams {
  serviceName?: string;
  filesPath?: string;
}

/**
 * Format validator for the {@link PublicKey} interface
 */
export const publicKeyValidator = ow.object.exactShape({
  '@type': ow.string,
  key: ow.string,
});

/**
 * Base shape to be validated for an account
 */
const AccountShape = {
  name: ow.string,
  address: ow.string,
  publicKey: publicKeyValidator,
};

/**
 * Format validator for the {@link Account} interface
 */
export const accountValidator = ow.object.exactShape(AccountShape);

/**
 * Format validator for the {@link AccountWithMnemonic} interface
 */
export const accountWithMnemonicValidator = ow.object.exactShape({
  ...AccountShape,
  mnemonic: ow.string,
});
