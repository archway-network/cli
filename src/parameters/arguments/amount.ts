import { Args } from '@oclif/core';

import { Amount } from '@/types';
import { parseAmount } from '@/utils';

const AmountArgumentDescription = 'Token amount';

/**
 * Definition of Amount required argument
 */
export const ParamsAmountRequiredArg = {
  required: true,
  description: AmountArgumentDescription,
  parse: async (val: string): Promise<Amount> => parseAmount(val),
};

/**
 * Amount required argument
 */
export const AmountRequiredArg = Args.custom<Amount>(ParamsAmountRequiredArg)();
