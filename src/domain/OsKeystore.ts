import keyring from '@archwayhq/keyring-go';

import { InvalidPasswordError } from '@/exceptions';
import { Accounts } from '@/domain/Accounts';
import { KeystoreBackend } from '@/domain/KeystoreBackend';

import { Account, AccountBase, AccountType } from '@/types';

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
   * {@inheritDoc KeystoreBackend.get}
   */
  async get(nameOrAddress: string): Promise<Account | undefined> {
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

      return result;
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
