import { Flags } from '@oclif/core';

import { Amount } from '@/types';
import { parseAmount } from '@/utils';

const AmountFlagDescription = 'Token amount';

/**
 * Definition of Amount optional flag
 */
export const ParamsAmountOptionalFlag = {
  description: AmountFlagDescription,
  parse: async (val: string): Promise<Amount> => parseAmount(val),
};

/**
 * Amount optional flag
 */
export const AmountOptionalFlag = Flags.custom<Amount>(ParamsAmountOptionalFlag)();

/**
 * Definition of Amount required flag
 */
export const ParamsAmountRequiredFlag = {
  ...ParamsAmountOptionalFlag,
  required: true,
};

/**
 * Amount required flag
 */
export const AmountRequiredFlag = Flags.custom<Amount>(ParamsAmountRequiredFlag)();
