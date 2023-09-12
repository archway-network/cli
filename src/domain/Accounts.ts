import * as bip39 from 'bip39';
import _ from 'lodash';

import { fromBase64, toBase64 } from '@cosmjs/encoding';
import { DirectSecp256k1Wallet } from '@cosmjs/proto-signing';
import { StargateClient } from '@cosmjs/stargate';

import { Config, Ledger } from '@/domain';
import { AlreadyExistsError, InvalidFormatError } from '@/exceptions';
import { Prompts } from '@/services';
import {
  Account,
  AccountBalancesJSON,
  AccountBase,
  AccountType,
  AccountWithSigner,
  ExtendedHdPath,
  KeystoreBackendType,
  PublicKey,
  redactAccount
} from '@/types';
import { assertIsValidAddress, bold, convertUnarmoredHexToPrivateKey, derivePrivateKey, isHex, yellow } from '@/utils';

import { Keystore, KeystoreBackendParams } from './keystore';

export const DEFAULT_ADDRESS_BECH_32_PREFIX = 'archway';

export type KeyringFlags = {
  'keyring-backend'?: KeystoreBackendType;
  'keyring-path'?: string
};

/**
 * Accounts manager
 */
export class Accounts {
  /**
   * @param keystore - Keystore facade to interface with the keyring serialization and deserialization
   */
  constructor(private readonly keystore: Keystore) {
    this.keystore = keystore;
  }

  /**
   * Initializes the account management class by setting up the keystore that will be used as backend for storing/reading the accounts.
   *
   * @param keystoreParams - Parameters for getting the accounts {@link KeystoreBackendParams}
   * @returns Promise containing an instance of {@link Accounts}
   */
  static async init(keystoreParams: KeystoreBackendParams): Promise<Accounts> {
    const keystore = Keystore.build(keystoreParams);
    return new Accounts(keystore);
  }

  /**
   * Initializes the account management class by receiving the flags from a command and an instance of {@link Config}
   *
   * @returns Promise containing an instance of {@link Accounts}
   */
  static async initFromFlags(flags: KeyringFlags, config: Config): Promise<Accounts> {
    const backendType = flags['keyring-backend'] || config.keyringBackend;
    const filesPath = flags['keyring-path'] || config.keyringPath;
    return Accounts.init({ backendType, filesPath });
  }

  /**
   * Get a formatted version of the public key
   *
   * @param publicKey - Instance of {@link PublicKey} to be printed
   * @returns Pretty formatted string
   */
  static prettyPrintPublicKey(publicKey: PublicKey): string {
    return `${bold('Public Key')}\n  ${bold('Algo:')} ${publicKey.algo}\n  ${bold('Key:')} ${publicKey.key}`;
  }

  /**
   * Get a formatted version of the name and address
   *
   * @param publicKey - Instance of {@link AccountBase} to be printed
   * @returns Pretty formatted string
   */
  static prettyPrintNameAndAddress(account: AccountBase): string {
    return `${bold('Name:')} ${account.name}\n${bold('Address:')} ${account.address}${
      account.type === AccountType.LEDGER ? `\n${yellow('Ledger account')}` : ''
    }`;
  }

  /**
   * Create a new account and stores it in the keyring
   *
   * @param name - Account name
   * @param type - {@link AccountType} value
   * @param hdPath - HD path of the account
   * @returns Promise with the newly created {@link Account} and the mnemonic used
   */
  async new(name: string, type: AccountType, hdPath: ExtendedHdPath): Promise<[Account, string]> {
    const mnemonic = bip39.generateMnemonic();
    const account = await this.createOrImport(name, type, hdPath, mnemonic);
    return [account, mnemonic];
  }

  /**
   * Recovers an account from an existing mnemonic or private key and stores it in the keyring
   *
   * @param name - Account name
   * @param type - {@link AccountType} value
   * @param hdPath - HD path of the account
   * @param mnemonicOrUnarmoredHex - Existing mnemonic or private key hex to use for the new account
   * @returns Promise containing an instance of {@link Account}
   */
  async import(name: string, hdPath: ExtendedHdPath, mnemonicOrUnarmoredHex: string): Promise<Account> {
    return this.createOrImport(name, AccountType.LOCAL, hdPath, mnemonicOrUnarmoredHex);
  }

  /**
   * Create a new {@link Account}, from a ledger, mnemonic or private key
   *
   * @param name - Account name
   * @param type - {@link AccountType} value
   * @param mnemonicOrUnarmoredHex - Existing mnemonic or private key to use
   * @param hdPath - HD path of the account
   * @param prefix - Optional - Bech 32 prefix for the generated address, defaults to 'archway'
   * @returns Promise containing the {@link Account}
   */
  private async createOrImport(
    name: string,
    type: AccountType,
    hdPath: ExtendedHdPath,
    mnemonicOrUnarmoredHex: string
  ): Promise<Account> {
    await this.assertAccountDoesNotExist(name);

    const account = (type === AccountType.LEDGER) ?
      await Ledger.getAccount(name, hdPath, DEFAULT_ADDRESS_BECH_32_PREFIX) :
      await this.createLocalAccount(name, hdPath, mnemonicOrUnarmoredHex);

    await this.assertAccountDoesNotExist(account.address);
    await this.keystore.save(account);

    return account;
  }

  private async createLocalAccount(
    name: string,
    hdPath: ExtendedHdPath,
    mnemonicOrUnarmoredHex: string
  ): Promise<Account> {
    if (!bip39.validateMnemonic(mnemonicOrUnarmoredHex) && !isHex(mnemonicOrUnarmoredHex)) {
      throw new InvalidFormatError('Mnemonic or private key');
    }

    const privKey = bip39.validateMnemonic(mnemonicOrUnarmoredHex) ?
      await derivePrivateKey(mnemonicOrUnarmoredHex, hdPath.value) :
      await convertUnarmoredHexToPrivateKey(mnemonicOrUnarmoredHex);

    const wallet = await DirectSecp256k1Wallet.fromKey(privKey, DEFAULT_ADDRESS_BECH_32_PREFIX);
    const { address, algo, pubkey } = (await wallet.getAccounts())[0];

    const account = {
      type: AccountType.LOCAL,
      name,
      address,
      publicKey: {
        algo,
        key: toBase64(pubkey),
      },
      privateKey: toBase64(privKey),
    };

    return account;
  }

  /**
   * Check if an account doesn't exist by name or address, if it exists throws an error
   *
   * @param nameOrAddress - Account name or address to search by
   */
  async assertAccountDoesNotExist(nameOrAddress: string): Promise<void> {
    if (this.keystore.exists(nameOrAddress)) {
      throw new AlreadyExistsError('Account', nameOrAddress)
    }
  }

  /**
   * Get a single account by name or address, without private key
   *
   * @param nameOrAddress - Account name or account address to search by
   * @returns Promise containing an instance of {@link Account}
   */
  async get(nameOrAddress: string): Promise<Account> {
    const account = await this.keystore.get(nameOrAddress);
    return redactAccount(account);
  }

  /**
   * Get a single account by name or address with its signer, if not provided will ask for it on a prompt.
   * Throws error if the account is not found
   *
   * @param nameOrAddress - Optional - Account name or account address to search by
   * @param defaultAccount - Optional - Default account name or account address
   * @param prefix - Optional - Bech 32 prefix for the address, defaults to 'archway'
   * @returns Promise containing an instance of {@link AccountWithSigner}
   */
  async getWithSigner(
    nameOrAddress?: string,
    defaultAccount?: string,
    prefix = DEFAULT_ADDRESS_BECH_32_PREFIX
  ): Promise<AccountWithSigner> {
    const searchAccount = nameOrAddress || defaultAccount || (await Prompts.fromAccount());
    const account = await this.keystore.get(searchAccount);

    const signer = account.type === AccountType.LEDGER ?
      await Ledger.getLedgerSigner(new ExtendedHdPath(account.hdPath), prefix) :
      await DirectSecp256k1Wallet.fromKey(fromBase64(account.privateKey!), prefix);

    return {
      account: redactAccount(account),
      signer,
    };
  }

  /**
   * Get a list of the accounts in the keystore
   * @returns Promise containing an array with all the accounts in the keystore
   */
  async list(): Promise<readonly Account[]> {
    const accounts = await this.keystore.list();
    return accounts.map(account => redactAccount(account));
  }

  /**
   * Get a list of the accounts in the keystore, only by name and address
   * @returns Promise containing an array with all the accounts in the keystore
   */
  async listNameAndAddress(): Promise<readonly AccountBase[]> {
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
    const { name, address } = await this.keystore.get(nameOrAddress);
    const balances = await client.getAllBalances(address);

    return {
      account: {
        name,
        address,
        balances,
      },
    };
  }

  /**
   * Create an instance of {@link AccountBase} from an address, getting the name if found in keyring
   *
   * @param address - Account address to search by
   * @param prefix - Optional - Bech 32 prefix for the address, defaults to 'archway'
   * @returns Promise containing an instance of {@link AccountBase}
   */
  async accountBaseFromAddress(address: string, prefix = DEFAULT_ADDRESS_BECH_32_PREFIX): Promise<AccountBase> {
    const account = this.keystore.findAccountBase(address);
    if (!account) {
      // If the account is not found in the keyring, check if it's a valid address so the tx doesn't fail
      assertIsValidAddress(address, prefix);
    }

    return _.merge(account, { type: AccountType.LOCAL, name: address, address });
  }
}
