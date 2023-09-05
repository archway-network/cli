import keyring from '@archwayhq/keyring-go';
import { DirectSecp256k1HdWallet, DirectSecp256k1Wallet } from '@cosmjs/proto-signing';
import { fromBase64 } from '@cosmjs/encoding';
import { HdPath } from '@cosmjs/crypto';

import { InvalidPasswordError } from '@/exceptions';
import { DEFAULT_ADDRESS_BECH_32_PREFIX } from './Accounts';
import { KeystoreBackend } from './KeystoreBackend';

import { Account, AccountBase, AccountType, AccountWithSigner } from '@/types';

/**
 * Implementation of an OS based keystore
 */
export class OsKeystore extends KeystoreBackend {
  /**
   * @param serviceName - Service name to group the account entries in the OS keystore
   */
  constructor(private serviceName: string) {
    super();
  }

  /**
   * {@inheritDoc KeystoreBackend.add}
   */
  async add(name: string, type: AccountType, mnemonicOrPrivateKey?: string, hdPath?: HdPath): Promise<Account> {
    const account = await this.createAccountObject(name, type, mnemonicOrPrivateKey, hdPath);

    keyring.OsStore.set(
      this.serviceName,
      this.createEntryTag(account.name, account.type, account.address),
      JSON.stringify({ ...account, mnemonic: undefined })
    );

    return account;
  }

  /**
   * {@inheritDoc KeystoreBackend.listNameAndAddress}
   */
  async listNameAndAddress(): Promise<AccountBase[]> {
    const found: string[] = keyring.OsStore.list(this.serviceName);
    const result: AccountBase[] = [];

    for (const item of found) {
      const auxAccount = this.parseEntryTag(item);
      if (auxAccount) result.push(auxAccount);
    }

    return result;
  }

  /**
   * {@inheritDoc KeystoreBackend.getWithSigner}
   */
  async getWithSigner(nameOrAddress: string, prefix = DEFAULT_ADDRESS_BECH_32_PREFIX): Promise<AccountWithSigner | undefined> {
    const tag = await this.findAccountTag(nameOrAddress);
    let stored = '';

    try {
      stored = keyring.OsStore.get(this.serviceName, tag);
    } catch (error: Error | any) {
      if (error?.message?.includes?.('Keyring backend access denied by user')) throw new InvalidPasswordError();
    }

    if (stored) {
      let result = JSON.parse(stored);

      if (this.isValidAccountWithMnemonic(result)) {
        // Convert stored account info to private key instead of mnemonic (since version alpha.2)
        const deserialized = await DirectSecp256k1HdWallet.deserialize(result.mnemonic, result.address);
        const privateKey = await this.convertMnemonicToPrivateKey(deserialized.mnemonic);

        result = {
          ...result,
          mnemonic: undefined,
          privateKey,
        };

        keyring.OsStore.set(this.serviceName, tag, JSON.stringify(result));
      }

      this.assertIsValidAccountWithPrivateKey(result);

      const signer =
        result.type === AccountType.LEDGER ? undefined : await DirectSecp256k1Wallet.fromKey(fromBase64(result.privateKey), prefix);

      return {
        account: { ...result, mnemonic: undefined, privateKey: undefined },
        signer,
      };
    }
  }

  /**
   * {@inheritDoc KeystoreBackend.remove}
   */
  async remove(nameOrAddress: string): Promise<void> {
    const tag = await this.findAccountTag(nameOrAddress);

    keyring.OsStore.remove(this.serviceName, tag);
  }
}
