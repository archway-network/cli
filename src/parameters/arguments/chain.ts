import { Args } from '@oclif/core';

import { ParamsChainOptionalFlag } from '../flags';

/**
 * Definition of Chain id argument that is required
 */
export const ParamsChainRequiredArg = {
  ...ParamsChainOptionalFlag,
  required: true,
};

/**
 * Chain id argument that is required
 */
export const ChainRequiredArg = Args.string(ParamsChainRequiredArg);
