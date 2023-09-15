import { Bip39, EnglishMnemonic, HdPath, Secp256k1, Slip10, Slip10Curve } from '@cosmjs/crypto';
import { bech32 } from 'bech32';

import { InvalidFormatError } from '@/exceptions';

/**
 * Verify if a string has a valid address format, throws error if not
 *
 * @param address - String to validate
 * @param prefix - Optional - Bech32 address prefix to validate
 * @returns void
 */
export function assertIsValidAddress(address: string, prefix?: string): void {
  if (!isValidAddress(address, prefix)) {
    throw new InvalidFormatError(`Address ${address}`)
  }
}

/**
 * Verify if a string has a valid address format
 *
 * @param address - String to validate
 * @param prefix - Optional - Bech32 address prefix to validate
 * @returns Boolean, whether it is valid or not
 */
export function isValidAddress(address: string, prefix?: string): boolean {
  const ALLOWED_PRINTABLE_ASCII = ' -~';
  const ALLOWED_CHARS = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

  const regexp = new RegExp(`^(${prefix || `[${ALLOWED_PRINTABLE_ASCII}]+`})1([${ALLOWED_CHARS}]+)$`); // Prefix + bech32 separated by '1'
  const match = regexp.exec(address);
  if (!match) {
    return false;
  }

  try {
    const decoded = bech32.decode(address);
    return decoded?.words?.length === 32 || decoded?.words?.length === 52;
  } catch {
    return false;
  }
}

/**
 * Derives the private key for a given mnemonic and derivation path.
 *
 * @param mnemonic - Mnemonic to convert
 * @param hdPath - Derivation path to get the account that will be extracted
 * @param bip39Password - Optional - Password used to generate the seed
 * @returns Promise containing the private key bytes
 */
export async function derivePrivateKey(mnemonic: string, hdPath: HdPath, bip39Password = ''): Promise<Uint8Array> {
  const seed = await Bip39.mnemonicToSeed(new EnglishMnemonic(mnemonic), bip39Password);
  const { privkey } = Slip10.derivePath(Slip10Curve.Secp256k1, seed, hdPath);
  return privkey;
}

/**
 * Converts an unarmored hex string to a private key.
 *
 * @param unarmoredHex - Unarmored hex string to convert
 * @returns Promise containing the private key bytes
 */
export async function convertUnarmoredHexToPrivateKey(unarmoredHex: string): Promise<Uint8Array> {
  if (!isHex(unarmoredHex)) {
    throw new InvalidFormatError('Unarmored hex string');
  }

  const privKey = Buffer.from(unarmoredHex, 'hex');
  const { privkey } = await Secp256k1.makeKeypair(privKey);
  return privkey;
}

export function isHex(value: string): boolean {
  return /^[\dA-Fa-f]+$/.test(value);
}
