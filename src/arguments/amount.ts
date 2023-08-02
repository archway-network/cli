import { Args } from '@oclif/core';

import { parseAmount } from '@/utils/coin';

import { Amount } from '@/types/Coin';

const AmountArgumentDescription = 'Token amount';

/**
 * Definition of Amount required argument
 */
export const definitionAmountRequired = {
  required: true,
  description: AmountArgumentDescription,
  parse: async (val: string): Promise<Amount> => parseAmount(val),
};

/**
 * Amount required argument
 */
export const amountRequired = Args.custom<Amount>(definitionAmountRequired);
