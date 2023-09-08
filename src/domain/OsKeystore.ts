import keyring from '@archwayhq/keyring-go';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';

import { InvalidPasswordError } from '@/exceptions';
import { Accounts } from './Accounts';
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
  async add(name: string, type: AccountType, mnemonic?: string): Promise<Account> {
    const account = await this.createAccountObject(name, type, mnemonic);

    keyring.OsStore.set(this.serviceName, this.createEntryTag(account.name, account.type, account.address), JSON.stringify(account));

    return {
      ...account,
      mnemonic: account.mnemonic && (await DirectSecp256k1HdWallet.deserialize(account.mnemonic, account.address)).mnemonic,
    };
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
   * {@inheritDoc KeystoreBackend.get}
   */
  async getWithSigner(nameOrAddress: string): Promise<AccountWithSigner | undefined> {
    const tag = await this.findAccountTag(nameOrAddress);
    let stored = '';

    try {
      stored = keyring.OsStore.get(this.serviceName, tag);
    } catch (error: Error | any) {
      if (error?.message?.includes?.('Keyring backend access denied by user')) throw new InvalidPasswordError();
    }

    if (stored) {
      const result = JSON.parse(stored);

      Accounts.assertIsValidAccountWithMnemonic(result);

      const signer =
        result.type === AccountType.LEDGER ? undefined : await DirectSecp256k1HdWallet.deserialize(result.mnemonic, result.address);

      return {
        account: result,
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
