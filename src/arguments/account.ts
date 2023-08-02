import { Args } from '@oclif/core';

const AccountArgumentDescription = 'Name of the key/account OR a valid bech32 address';

/**
 * Definition of Account required argument
 */
export const definitionAccountRequired = {
  required: true,
  description: AccountArgumentDescription,
};

/**
 * Account required argument
 */
export const accountRequired = Args.string(definitionAccountRequired);
