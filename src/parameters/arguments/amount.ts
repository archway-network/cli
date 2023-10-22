import { Args } from '@oclif/core';

import { Amount } from '@/types';

import { parseAmount } from '../shared/amount';

export const AmountArgs = {
  /**
   * Argument that parses a token amount
   */
  amount: Args.custom<Amount>({
    description: 'Token amount',
    parse: (val: string): Promise<Amount> => Promise.resolve(parseAmount(val)),
  })
};
