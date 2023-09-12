import keyring from '@archwayhq/keyring-go';

import { InvalidPasswordError } from '@/exceptions';
import { KeystoreBackend } from './KeystoreBackend';

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
   * {@inheritDoc KeystoreBackend.save}
   */
  protected async save(_name: string, tag: string, data: string): Promise<void> {
    keyring.OsStore.set(this.serviceName, tag, data);
  }

  /**
   * {@inheritDoc KeystoreBackend.getFromStorage}
   */
  protected async getFromStorage(nameOrAddress: string): Promise<string> {
    const tag = await this.findAccountTag(nameOrAddress);

    try {
      return keyring.OsStore.get(this.serviceName, tag);
    } catch (error: Error | any) {
      if (error?.message?.includes?.('Keyring backend access denied by user')) {
        throw new InvalidPasswordError()
      }

      throw error;
    }
  }

  /**
   * {@inheritDoc KeystoreBackend.listFromStorage}
   */
  protected listFromStorage(): readonly string[] {
    try {
      return keyring.OsStore.list(this.serviceName);
    } catch {
      return [];
    }
  }

  /**
   * {@inheritDoc KeystoreBackend.remove}
   */
  async remove(nameOrAddress: string): Promise<void> {
    const tag = await this.findAccountTag(nameOrAddress);

    try {
      keyring.OsStore.remove(this.serviceName, tag);
    } catch (error: Error | any) {
      if (error?.message?.includes?.('Keyring backend access denied by user')) {
        throw new InvalidPasswordError()
      }

      throw error;
    }
  }
}
