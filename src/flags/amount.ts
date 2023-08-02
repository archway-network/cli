import { Flags } from '@oclif/core';

import { parseAmount } from '@/utils/coin';

import { Amount } from '@/types/Coin';

const AmountFlagDescription = 'Token amount';

/**
 * Definition of Amount optional flag
 */
export const definitionAmountOptional = {
  description: AmountFlagDescription,
  parse: async (val: string): Promise<Amount> => parseAmount(val),
};

/**
 * Amount optional flag
 */
export const amountOptional = Flags.custom<Amount>(definitionAmountOptional);

/**
 * Definition of Amount required flag
 */
export const definitionAmountRequired = {
  ...definitionAmountOptional,
  required: true,
};

/**
 * Amount required flag
 */
export const amountRequired = Flags.custom<Amount>(definitionAmountRequired);
