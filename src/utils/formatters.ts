import { BigNumber } from 'bignumber.js';

export function formatNumber(
  val: BigNumber | number | string,
  decimals?: number,
  removeTrailingZeroes = true
): string {
  // Get formatted Number
  const formatted = new BigNumber(val).toFormat(decimals);
  if (!removeTrailingZeroes) {
    return formatted;
  }

  return formatted
    // Remove trailing zeroes
    .replace(/(\.\d*?)0*$/, '$1')
    // If only dot is left at the end, remove it
    .replace(/\.$/, '');
}
