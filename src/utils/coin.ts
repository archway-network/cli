/* eslint-disable new-cap */
import BigNumber from 'bignumber.js';

import { Coin, parseCoins } from '@cosmjs/proto-signing';
import { StdFee } from '@cosmjs/stargate';

import { InvalidFormatError } from '@/exceptions';
import { Amount } from '@/types';
import { bold, greenBright, white, yellow } from '@/utils/style';

export const DEFAULT_GAS_PRICE_AMOUNT = '0.005';
export const DEFAULT_GAS_PRICE_DENOM = 'aarch';
export const DEFAULT_DECIMALS = 18;
export const DEFAULT_COIN_DENOM = 'ARCH';

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

  const gasLimit = BigNumber(coin.amount).div(gasPrice);

  return {
    amount: [coin],
    gas: gasLimit.toString(),
  };
};

/**
 * Formats a number input, adding thousand separators and rounding to the specified decimals
 *
 * @param val - Value to be formatted
 * @param decimals - Optional - Number of decimals that will be rounded to
 * @param removeTrailingZeroes - Optional - Boolean, whether keep trailing zeroes after rounding decimals, or not
 * @returns String representing the formatted number
 */
export const formatNumber = (val: number | string | BigNumber, decimals?: number, removeTrailingZeroes = true): string => {
  // Get formatted Number
  const formatted = BigNumber(val).toFormat(decimals);
  return removeTrailingZeroes ?
    formatted
    // Remove trailing zeroes
      .replace(/(\.\d*?)0*$/, '$1')
    // If only dot is left at the end, remove it
      .replace(/\.$/, '') :
    formatted;
};

/**
 * Pretty prints an instance of {@link Coin}
 * If it is a known minimal denom, includes both the human readable amount, and the minimal denom amount.
 *
 * @param value - {@link Coin} to be displayed
 * @returns Pretty formatted string
 */
export const prettyPrintCoin = (value: Coin): string => {
  const coinInfo: Record<string, { denom: string; decimals: number }> = {
    aarch: {
      denom: 'ARCH',
      decimals: 18,
    },
    aconst: {
      denom: 'CONST',
      decimals: 18,
    },
  };

  if (Object.keys(coinInfo).includes(value.denom)) {
    const foundInfo = coinInfo[value.denom];
    const converted = BigNumber(value.amount).shiftedBy(-foundInfo.decimals);

    return `${bold(`${formatNumber(converted, foundInfo.decimals)} ${foundInfo.denom}`)} ${white.reset(`(${value.amount}${value.denom})`)}`;
  }

  return bold(`${value.amount}${value.denom}`);
};

/**
 * Pretty prints a list of balances
 * If it is a known minimal denom, includes both the human readable amount, and the minimal denom amount.
 *
 * @param value - Array of {@link Coin} to be displayed
 * @returns Pretty formatted string
 */
export function prettyPrintBalancesList(balances: readonly Coin[], emptyMessage = 'Empty balance'): string {
  if (balances.length === 0) return `- ${yellow(emptyMessage)}`;
  // eslint-disable-next-line unicorn/no-array-reduce
  return balances.reduce((previous, current) => `${previous}- ${greenBright(prettyPrintCoin(current))}\n`, '');
}
