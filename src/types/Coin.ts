import { Coin as StargateCoin } from '@cosmjs/stargate';
import ow from 'ow';

/**
 * Cosmos Coin information
 */

/**
 * Format validator for the {@link Coin} interface
 */
export const coinValidator = ow.optional.object.exactShape({
  denom: ow.string,
  amount: ow.string,
});

export interface Amount {
  coin: StargateCoin;
  plainText: string;
}

export { Coin } from '@cosmjs/stargate';
