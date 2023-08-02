import { Args } from '@oclif/core';

import { sanitizeDirName } from '@/utils';

const ContractArgumentDescription = 'Name of the contract';

/**
 * Definition of Contract name required argument
 */
export const definitionContractNameRequired = Args.string({
  required: true,
  parse: async val => sanitizeDirName(val),
  description: ContractArgumentDescription,
});

/**
 * Contract name required argument
 */
export const contractNameRequired = Args.string(definitionContractNameRequired);
