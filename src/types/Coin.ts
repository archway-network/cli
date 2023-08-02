import ow from 'ow';
import { Coin as StargateCoin } from '@cosmjs/stargate';

/**
 * Cosmos Coin information
 */
export { StargateCoin as Coin };

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
