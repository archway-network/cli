import { Flags } from '@oclif/core';

import { Amount } from '@/types';

import { parseAmount } from '../shared/amount';

export const AmountFlags = {
  /**
   * Flag to parse a token amount
   */
  amount: Flags.custom<Amount>({
    description: 'Token amount',
    parse: (val: string): Promise<Amount> => Promise.resolve(parseAmount(val)),
  })
};
