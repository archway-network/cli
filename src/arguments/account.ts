import { Args } from '@oclif/core';

const AccountArgumentDescription = 'Name of the key/account';

/**
 * Contract name argument
 */
export const accountRequired = Args.string({
  required: true,
  description: AccountArgumentDescription,
});
