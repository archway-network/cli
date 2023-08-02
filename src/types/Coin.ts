import ow from 'ow';

/**
 * Cosmos Coin information
 */
export interface Coin {
  denom: string;
  amount: string;
}

/**
 * Format validator for the {@link Coin} interface
 */
export const coinValidator = ow.optional.object.exactShape({
  denom: ow.string,
  amount: ow.string,
});
