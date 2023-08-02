import { Args } from '@oclif/core';

import { parseAmount } from '@/utils/coin';

import { Amount } from '@/types/Coin';

const AmountArgumentDescription = 'Token amount';

/**
 * Contract name argument
 */
export const amountRequired = Args.custom<Amount>({
  required: true,
  description: AmountArgumentDescription,
  parse: async (val: string) => parseAmount(val),
});
