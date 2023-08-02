import { Args } from '@oclif/core';

import { sanitizeDirName } from '@/utils';

const ContractArgumentDescription = 'Name of the contract';

/**
 * Definition of Contract name optional argument
 */
export const ParamsContractNameOptionalArg = {
  parse: async (val: string): Promise<string> => sanitizeDirName(val),
  description: ContractArgumentDescription,
};

/**
 * Contract name optional argument
 */
export const ContractNameOptionalArg = Args.string(ParamsContractNameOptionalArg);

/**
 * Definition of Contract name required argument
 */
export const ParamsContractNameRequiredArg = {
  ...ParamsContractNameOptionalArg,
  required: true,
};

/**
 * Contract name required argument
 */
export const ContractNameRequiredArg = Args.string(ParamsContractNameRequiredArg);
