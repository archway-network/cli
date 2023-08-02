import { Args } from '@oclif/core';

const AccountArgumentDescription = 'Name of the key/account OR a valid bech32 address';

/**
 * Contract name argument
 */
export const accountRequired = Args.string({
  required: true,
  description: AccountArgumentDescription,
});
