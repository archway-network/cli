import { Args } from '@oclif/core';

import { sanitizeDirName } from '@/utils/sanitize';

const ContractArgumentDescription = 'Name of the contract';

/**
 * Contract name argument
 */
export const contractNameRequired = Args.string({
  required: true,
  parse: async val => sanitizeDirName(val),
  description: ContractArgumentDescription,
});
