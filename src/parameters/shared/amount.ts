import { parseCoins } from '@cosmjs/amino';

import { InvalidFormatError } from '@/exceptions';
import { Amount } from '@/types';

/**
 * Converts a string with an amount info into an instance of {@link Amount}
 * throws error if invalid or if more than one coin in the string
 *
 * @param value - String to be parsed
 * @returns Instance of {@link Amount}
 */
export function parseAmount(value: string): Amount {
  const parsed = parseCoins(value);

  if (parsed.length !== 1) {
    throw new InvalidFormatError('Amount');
  }

  const coin = parsed[0];

  return {
    coin,
    plainText: `${coin.amount}${coin.denom}`,
  };
}
