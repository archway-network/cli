import { Coin, parseCoins } from '@cosmjs/proto-signing';
import { StdFee } from '@cosmjs/stargate';
import BigNumber from 'bignumber.js';

import { InvalidFormatError } from '@/exceptions';

import { Amount } from '@/types';

export const DEFAULT_GAS_PRICE_AMOUNT = '0.005'
export const DEFAULT_GAS_PRICE_DENOM = 'aarch'

/**
 * Converts a string with an amount info into an instance of {@link Amount}
 * throws error if invalid or if more than one coin in the string
 *
 * @param value - String to be parsed
 * @returns Instance of {@link Amount}
 */
export const parseAmount = (value: string): Amount => {
  const parsed = parseCoins(value);

  if (parsed.length !== 1) throw new InvalidFormatError('Amount');

  const coin = parsed[0];

  return {
    coin,
    plainText: `${coin.amount}${coin.denom}`,
  };
};

/**
 * Builds an instance of {@link StdFee} from a {@link Coin} and gas price.
 *
 * @param coin - Optional - Amount and denom to be used as fees, defaults to 'auto'
 * @param gasPrice - Optional - Gas Price to calculate the limit (just amount, without denom)
 * @returns Instance of {@link StdFee} to be used as a transaction fee
 */
export const buildStdFee = (coin?: Coin, gasPrice: string | number = DEFAULT_GAS_PRICE_AMOUNT): StdFee | 'auto' => {
  if (!coin) return 'auto';

  // eslint-disable-next-line new-cap
  const gasLimit = BigNumber(coin.amount).div(gasPrice);

  return {
    amount: [coin],
    gas: gasLimit.toString(),
  };
};
