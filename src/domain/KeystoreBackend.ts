import { DirectSecp256k1HdWallet, DirectSecp256k1Wallet } from '@cosmjs/proto-signing';
import { fromBase64, toBase64 } from '@cosmjs/encoding';
import { Bip39, EnglishMnemonic, HdPath, Slip10, Slip10Curve } from '@cosmjs/crypto';
import ow from 'ow';

import { Ledger } from '@/domain';
import { DEFAULT_ADDRESS_BECH_32_PREFIX, ENTRY_SUFFIX, ENTRY_TAG_SEPARATOR } from './Accounts';
import { AlreadyExistsError, InvalidFormatError, NotFoundError } from '@/exceptions';
import { makeCosmosDerivationPath } from '@/utils';

import {
  Account,
  AccountBase,
  AccountType,
  AccountWithSigner,
  accountValidator,
  accountWithMnemonicValidator,
  accountWithPrivateKeyValidator,
} from '@/types';

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
   * @param hdPath - Optional - HD path of the account, Defaults to 0/0/0/0
   * @returns Promise containing the newly created account data
   */
  abstract add(name: string, type: AccountType, mnemonic?: string, hdPath?: HdPath): Promise<Account>;

  /**
   * Get a list of the accounts in the keystore, only getting their basic info
   * @returns Promise containing an array with all the accounts in the keystore
   */
  abstract listNameAndAddress(): Promise<AccountBase[]>;

  /**
   * Get a single account by name or address, including mnemonic
   *
   * @param nameOrAddress - Account name or account address to search by
   * @param prefix - Optional - Bech 32 prefix for the address, defaults to 'archway'
   * @returns Promise containing the account's data and signer, or undefined if it doesn't exist
   */
  abstract getWithSigner(nameOrAddress: string, prefix: string): Promise<AccountWithSigner | undefined>;

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
      const auxAccount = await this.get(item.address);

      if (auxAccount) result.push(auxAccount);
    }

    return result;
  }

  /**
   * Get a single account by name or address
   *
   * @param nameOrAddress - Account name or account address to search by
   * @param prefix - Optional - Bech 32 prefix for the address, defaults to 'archway'
   * @returns Promise containing the account's data, or undefined if it doesn't exist
   */
  async get(nameOrAddress: string, prefix = DEFAULT_ADDRESS_BECH_32_PREFIX): Promise<Account | undefined> {
    let found = await this.getWithSigner(nameOrAddress, prefix);

    if (found?.account) {
      const result: Account = {
        name: found.account.name,
        address: found.account.address,
        publicKey: found.account.publicKey,
        type: found.account.type,
      };

      found = undefined;

      return result;
    }
  }

  /**
   * Convert a mnemonic into a single account private key. Derivation path can be passed as a parameter.
   *
   * @param mnemonic - Mnemonic to convert
   * @param hdPath - Optional - Derivation path to get the account that will be extracted. Defaults to `m/44'/118'/0'/0/0`
   * @param bip39Password - Optional - Password used to generate the seed
   * @returns Promise containing the private key in base64 encoding
   */
  protected async convertMnemonicToPrivateKey(mnemonic: string, hdPath = makeCosmosDerivationPath(), bip39Password = ''): Promise<string> {
    const seed = await Bip39.mnemonicToSeed(new EnglishMnemonic(mnemonic), bip39Password);
    const { privkey } = Slip10.derivePath(Slip10Curve.Secp256k1, seed, hdPath);

    return toBase64(privkey);
  }

  /**
   * Create a new {@link Account}, can be from ledger, or from mnemonic
   *
   * @param name - Account name
   * @param type - {@link AccountType} value
   * @param mnemonicOrPrivateKey - Optional - Existing mnemonic or private key to use
   * @param hdPath - Optional - HD path of the account, Defaults to 0/0/0/0
   * @param prefix - Optional - Bech 32 prefix for the generated address, defaults to 'archway'
   * @returns Promise containing the {@link Account}
   */
  // eslint-disable-next-line max-params
  protected async createAccountObject(
    name: string,
    type: AccountType,
    mnemonicOrPrivateKey?: string,
    hdPath = makeCosmosDerivationPath(),
    prefix = DEFAULT_ADDRESS_BECH_32_PREFIX,
  ): Promise<Account> {
    let result: Account;

    if (type === AccountType.LEDGER) {
      result = await Ledger.getAccount(name);
    } else {
      const hdWallet = await (mnemonicOrPrivateKey ?
        (mnemonicOrPrivateKey.includes(' ') ?
          DirectSecp256k1HdWallet.fromMnemonic(mnemonicOrPrivateKey, { prefix, hdPaths: [hdPath] }) :
          undefined) :
        DirectSecp256k1HdWallet.generate(24, { prefix, hdPaths: [hdPath] }));

      const mnemonic = hdWallet?.mnemonic;

      const privateKey = mnemonic ? await this.convertMnemonicToPrivateKey(mnemonic, hdPath) : mnemonicOrPrivateKey!;

      const wallet = await DirectSecp256k1Wallet.fromKey(fromBase64(privateKey), prefix);

      const newAccount = (await wallet.getAccounts())[0];

      result = {
        name,
        address: newAccount.address,
        publicKey: {
          '@type': newAccount.algo,
          key: toBase64(newAccount.pubkey),
        },
        type: AccountType.LOCAL,
        mnemonic,
        privateKey,
      };
    }

    await this.assertAccountDoesNotExist(result.name);
    await this.assertAccountDoesNotExist(result.address);

    return result;
  }

  /**
   * Verify if an object has the valid format of a {@link Account} (including the private key except for ledger accounts), throws error if not
   *
   * @param data - Object instance to validate
   * @param name - Optional - Name of the account, will be used in the possible error
   * @returns void
   */
  protected assertIsValidAccountWithPrivateKey = (data: unknown, name?: string): void => {
    if (!this.isValidAccountWithPrivateKey(data)) throw new InvalidFormatError(name || 'Account');
  };

  /**
   * Verify if an object has the valid format of a {@link Account} (including private key, except for ledger accounts)
   *
   * @param data - Object instance to validate
   * @returns Boolean, whether it is valid or not
   */
  protected isValidAccountWithPrivateKey = (data: unknown): boolean => {
    return (data as any).type === AccountType.LEDGER ?
      ow.isValid(data, accountValidator) :
      ow.isValid(data, accountWithPrivateKeyValidator);
  };

  /**
   * Verify if an object has the valid format of a {@link Account} (including mnemonic, except for ledger accounts)
   *
   * @param data - Object instance to validate
   * @returns Boolean, whether it is valid or not
   */
  protected isValidAccountWithMnemonic = (data: unknown): boolean => {
    return (data as any).type === AccountType.LEDGER ? ow.isValid(data, accountValidator) : ow.isValid(data, accountWithMnemonicValidator);
  };

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
  protected async findAccountTag(nameOrAddress: string, suffix = ENTRY_SUFFIX): Promise<string> {
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
  protected createEntryTag(name: string, type: AccountType, address: string, suffix = ENTRY_SUFFIX): string {
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

      if (splitBySuffix.length !== 2 || splitBySuffix[1] !== suffix) return undefined;

      const splitAccountBase = splitBySuffix[0].split(ENTRY_TAG_SEPARATOR);

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
