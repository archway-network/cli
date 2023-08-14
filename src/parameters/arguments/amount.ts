import { Args } from '@oclif/core';

import { parseAmount } from '@/utils';

import { Amount } from '@/types';

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
