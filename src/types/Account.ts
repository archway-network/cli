import ow, { ArgumentError } from 'ow';

import { KdfConfiguration } from '@cosmjs/amino';
import { HdPath, pathToString, stringToPath } from '@cosmjs/crypto';
import { OfflineSigner } from '@cosmjs/proto-signing';

import { InvalidFormatError } from '@/exceptions';
import { Coin } from '@/types';
import { isValidAddress } from '@/utils';

export enum AccountType {
  LOCAL = 'local',
  LEDGER = 'ledger',
}

/**
 * Account base information
 */
export interface AccountBase {
  type: AccountType;
  name: string;
  address: string;
}

/**
 * Account information with private key
 */
export interface LocalAccount extends AccountBase {
  publicKey: PublicKey;
  privateKey?: string;
}

/**
 * Account information with optional private key
 */
export interface LedgerAccount extends AccountBase {
  publicKey: PublicKey;
  hdPath?: string;
}

export type Account = LocalAccount & LedgerAccount;

/**
 * Account with signer
 */
export interface AccountWithSigner {
  account: Account;
  signer: OfflineSigner;
}

/**
 * Account public key information
 */
export interface PublicKey {
  algo: string;
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
    balances: readonly Coin[];
  };
}

/**
 * Serialized key with kdf and encryption information
 */
export interface SerializedKey {
  type: string;
  kdf: KdfConfiguration;
  encryption: {
    algorithm: string;
  };
  data: string;
}

/**
 * Format validator for the {@link PublicKey} interface
 */
const publicKeyValidator = ow.object.exactShape({
  algo: ow.string,
  key: ow.string,
});

/**
 * Base shape to be validated for an account
 */
const AccountBaseShape = {
  type: ow.string.oneOf(Object.values(AccountType)),
  name: ow.string.matches(/^[\w#+./:@[\]-]{1,64}$/),
  address: ow.string.validate((value: string) => ({
    validator: isValidAddress(value),
    message: (label: string) => `Expected ${label} to be a valid address`,
  }))
};

/**
 * Format validator for the {@link AccountBase} interface
 */
const accountBaseValidator = ow.object.exactShape(AccountBaseShape);

/**
 * Format validator for the {@link LocalAccount} interface
 */
const localAccountValidator = ow.object.exactShape({
  ...AccountBaseShape,
  type: ow.string.equals(AccountType.LOCAL),
  publicKey: publicKeyValidator,
  privateKey: ow.string,
});

/**
 * Format validator for the {@link LedgerAccount} interface
 */
const ledgerAccountValidator = ow.object.exactShape({
  ...AccountBaseShape,
  type: ow.string.equals(AccountType.LEDGER),
  publicKey: publicKeyValidator,
  hdPath: ow.string,
});

/**
 * Format validator for the {@link Account} type
 */
const accountValidator = ow.any(
  localAccountValidator,
  ledgerAccountValidator
)

export function isAccountBase(a: AccountBase | string): a is AccountBase {
  return (a as AccountBase).address !== undefined
}

/**
 * Asserts if an object has the valid format of an {@link AccountBase}
 *
 * @param data - Object instance to validate
 * @param name - Optional - Name of the account, will be used in the possible error
 * @throws InvalidFormatError if the object does not have the valid format of an {@link Account}
 */
export function assertIsValidAccountBase(data: unknown, name?: string): void {
  try {
    ow(data, accountBaseValidator);
  } catch (error) {
    const validationErrors = (error instanceof ArgumentError) ? error.validationErrors : undefined;
    throw new InvalidFormatError(name || 'Account', validationErrors);
  }
}

/**
 * Asserts if an object has the valid format of an {@link Account}
 *
 * @param data - Object instance to validate
 * @param name - Optional - Name of the account, will be used in the possible error
 * @throws InvalidFormatError if the object does not have the valid format of an {@link Account}
 */
export function assertIsValidAccount(data: unknown, name?: string): void {
  try {
    ow(data, accountValidator);
  } catch (error) {
    const validationErrors = (error instanceof ArgumentError) ? error.validationErrors : undefined;
    throw new InvalidFormatError(name || 'Account', validationErrors);
  }
}

/**
 * Removes the private key from an {@link Account} object.
 *
 * @param account - Account object to sanitize
 * @returns Redacted account object
 */
export function redactAccount(account: Account): Account {
  const { type, name, address, hdPath, publicKey } = account;
  return {
    type,
    name,
    address,
    hdPath,
    publicKey,
  };
}

const DEFAULT_HD_PATH = "m/44'/118'/0'/0/0";

/**
 * Utility to quickly convert between a HdPath and its string representation.
 */
export class ExtendedHdPath {
  public static readonly Default = new ExtendedHdPath();

  private _value: HdPath;

  constructor(readonly input: string = DEFAULT_HD_PATH) {
    this._value = stringToPath(input);
  }

  toString(): string {
    return pathToString(this._value);
  }

  public get value(): HdPath {
    return this._value;
  }
}
