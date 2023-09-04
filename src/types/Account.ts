import ow from 'ow';
import { DirectSecp256k1Wallet } from '@cosmjs/proto-signing';

import { Coin } from '@/types';

export enum AccountType {
  LOCAL = 'local',
  LEDGER = 'ledger'
}

/**
 * Account base information
 */
export interface AccountBase {
  name: string;
  address: string;
  type: AccountType;
}

/**
 * Account information (with optional mnemonic or private key)
 */
export interface Account extends AccountBase {
  publicKey: PublicKey;
  mnemonic?: string;
  privateKey?: string;
}

/**
 * Account with signer
 */
export interface AccountWithSigner {
  account: Account,
  signer?: DirectSecp256k1Wallet;
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
export enum KeystoreBackendType {
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
  type: ow.string.oneOf(Object.values(AccountType)),
  mnemonic: ow.optional.string,
  privateKey: ow.optional.string,
};

/**
 * Format validator for the {@link Account} interface
 */
export const accountValidator = ow.object.exactShape(AccountShape);

/**
 * Format validator for the {@link Account} interface, with mandatory mnemonic value
 */
export const accountWithMnemonicValidator = ow.object.exactShape({
  ...AccountShape,
  mnemonic: ow.string,
});

/**
 * Format validator for the {@link Account} interface, with mandatory private key value
 */
export const accountWithPrivateKeyValidator = ow.object.exactShape({
  ...AccountShape,
  privateKey: ow.string,
});

