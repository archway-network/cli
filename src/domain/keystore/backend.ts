import { KeystoreBackendType } from '@/types';

/**
 * Options to be used when saving or fetching data from the keystore
 */
export interface KeystoreActionOptions {
  /**
   * Password to be used with the `FileBackend`
   */
  password?: string
}

/**
 * Definition to be used on different backend implementations
 */
export interface KeystoreBackend {
  /**
   * Get the raw data from the key storage by tag
   *
   * @param tag - Account tag to fetch
   * @param options - Options to be used when fetching the data
   * @returns Promise containing the stored raw data, or undefined if it doesn't exist
   */
  get(tag: string, options?: KeystoreActionOptions): string | undefined;

  /**
   * Get a list of the tags in the keystore
   *
   * @returns An array with all the tags in the keystore
   */
  list(): readonly string[];

  /**
   * Remove a tag from the keystore
   *
   * @param tag - Tag to be removed
   */
  remove(tag: string): void;

  /**
   * Saves raw data to the keyring
   *
   * @param tag - Tag used to save the account
   * @param data - Data to be saved
   * @param options - Options to be used when saving the data
   */
  save(tag: string, data: string, options?: KeystoreActionOptions): void;

  type: KeystoreBackendType;
}
