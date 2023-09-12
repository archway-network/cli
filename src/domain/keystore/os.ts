import keyring from '@archwayhq/keyring-go';

import { InvalidPasswordError } from '@/exceptions';
import { KeystoreBackendType } from '@/types';
import { KeystoreBackend, KeystoreOptions } from './backend';

const DEFAULT_SERVICE_NAME = 'io.archway.cli';

/**
 * Implementation of an OS based keystore
 */
export class OsBackend implements KeystoreBackend {
  public type: KeystoreBackendType = KeystoreBackendType.os;

  /**
   * @param serviceName - Service name to group the account entries in the OS keystore
   */
  public constructor(private serviceName: string = DEFAULT_SERVICE_NAME) {
    this.serviceName = serviceName;
  }

  save(tag: string, data: string, _options?: KeystoreOptions): void {
    keyring.OsStore.set(this.serviceName, tag, data);
  }

  get(tag: string, _options?: KeystoreOptions): string | undefined {
    try {
      return keyring.OsStore.get(this.serviceName, tag) || undefined;
    } catch (error: Error | any) {
      if (error?.message?.includes?.('Keyring backend access denied by user')) {
        throw new InvalidPasswordError()
      }

      throw error;
    }
  }

  list(): readonly string[] {
    try {
      return keyring.OsStore.list(this.serviceName);
    } catch {
      return [];
    }
  }

  remove(tag: string): void {
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
