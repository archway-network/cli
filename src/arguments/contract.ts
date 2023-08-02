import { Args } from '@oclif/core';

import { sanitizeDirName } from '@/utils';

const ContractArgumentDescription = 'Name of the contract';

/**
 * Definition of Contract name optional argument
 */
export const definitionContractNameOptional = {
  parse: async (val: string): Promise<string> => sanitizeDirName(val),
  description: ContractArgumentDescription,
};

/**
 * Contract name optional argument
 */
export const contractNameOptional = Args.string(definitionContractNameOptional);

/**
 * Definition of Contract name required argument
 */
export const definitionContractNameRequired = {
  ...definitionContractNameOptional,
  required: true,
};

/**
 * Contract name required argument
 */
export const contractNameRequired = Args.string(definitionContractNameRequired);
