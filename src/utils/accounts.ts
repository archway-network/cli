import { bech32 } from 'bech32';

import { InvalidFormatError } from '@/exceptions';

/**
 * Verify if a string has a valid address format, throws error if not
 *
 * @param address - String to validate
 * @param prefix - Optional - Bech32 address prefix to validate
 * @returns void
 */
export const assertIsValidAddress = (address: string, prefix?: string): void => {
  if (!isValidAddress(address, prefix)) throw new InvalidFormatError('Address');
};

/**
 * Verify if a string has a valid address format
 *
 * @param address - String to validate
 * @param prefix - Optional - Bech32 address prefix to validate
 * @returns Boolean, whether it is valid or not
 */
export const isValidAddress = (address: string, prefix?: string): boolean => {
  const ALLOWED_PRINTABLE_ASCII = ' -~';
  const ALLOWED_CHARS = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
  const regexp = new RegExp(`^(${prefix || `[${ALLOWED_PRINTABLE_ASCII}]+`})1([${ALLOWED_CHARS}]+)$`); // Prefix + bech32 separated by '1'
  const match = regexp.exec(address);

  try {
    if (match) {
      const decoded = bech32.decode(address);
      return decoded?.words?.length === 32 || decoded?.words?.length === 52;
    }
  } catch {
    return false;
  }

  return false;
};
