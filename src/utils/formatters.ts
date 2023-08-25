/* eslint-disable new-cap */
import BigNumber from 'bignumber.js';

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
