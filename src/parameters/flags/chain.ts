import { Flags } from '@oclif/core';

import { ChainRegistry } from '@/domain';

const ChainFlagDescription = 'ID of the chain';

/**
 * Util function to validate if a chain id exists, throws error if not
 * @param value - Chain id to validate
 * @returns Promise containing the chain id
 */
const validateChainId = async (value: string): Promise<string> => {
  const chainRegistry = await ChainRegistry.init();
  chainRegistry.assertGetChainById(value);

  return value;
};

/**
 * Definition of Chain id flag that is optional
 */
export const ParamsChainOptionalFlag = {
  description: ChainFlagDescription,
  parse: validateChainId,
};

/**
 * Chain id flag that is optional
 */
export const ChainOptionalFlag = Flags.string(ParamsChainOptionalFlag);

/**
 * Definition of Chain id flag that is required
 */
export const ParamsChainRequiredFlag = {
  ...ParamsChainOptionalFlag,
  required: true,
};

/**
 * Chain id flag that is required
 */
export const ChainRequiredFlag = Flags.string(ParamsChainRequiredFlag);
