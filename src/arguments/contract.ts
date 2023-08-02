import { Args } from '@oclif/core';

import { sanitizeDirName } from '@/utils/sanitize';

const ContractArgumentDescription = 'Contract name';

/**
 * Contract name argument
 */
export const contractNameRequired = Args.string({
  required: true,
  parse: async val => sanitizeDirName(val),
  description: ContractArgumentDescription,
});
