import { Args } from '@oclif/core';

import { parseAmount } from '@/utils/coin';

const AmountArgumentDescription = 'Token amount';

/**
 * Check if string is a valid coin
 *
 * @param value - User input to be validated
 * @returns The same value without any changes
 */
const validateCoin = async (value: string): Promise<string> => {
  parseAmount(value);

  return value;
};

/**
 * Contract name argument
 */
export const amountRequired = Args.string({
  required: true,
  description: AmountArgumentDescription,
  parse: validateCoin,
});
