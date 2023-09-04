import { bech32 } from 'bech32';
import { HdPath, Slip10RawIndex } from '@cosmjs/crypto';

import { InvalidFormatError } from '@/exceptions';

/**
 * Verify if a string has a valid address format, throws error if not
 *
 * @param address - String to validate
 * @param prefix - Optional - Bech32 address prefix to validate
 * @returns void
 */
export const assertIsValidAddress = (address: string, prefix?: string): void => {
  if (!isValidAddress(address, prefix)) throw new InvalidFormatError(`Address ${address}`);
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

/**
 * Creates a BIP44 compatible derivation path
 *
 * @param coinType - Optional - Defaults to 118 which is the standard cosmos coinType
 * @param account - Optional - Defaults to 0
 * @param change  - Optional - Defaults to 0
 * @param index  - Optional - Defaults to 0
 * @returns Array containing the derivation path values
 */
export function makeCosmosDerivationPath(coinType = 118, account = 0, change = 0, index = 0): HdPath {
  return [
    Slip10RawIndex.hardened(44),
    Slip10RawIndex.hardened(coinType),
    Slip10RawIndex.hardened(account),
    Slip10RawIndex.normal(change),
    Slip10RawIndex.normal(index),
  ];
}
