import { Args } from '@oclif/core';

const AccountNameArgumentDescription = 'Name of the key/account OR a valid bech32 address';

/**
 * Definition of Account optional argument
 */
export const ParamsAccountOptionalArg = {
  description: AccountNameArgumentDescription,
};

/**
 * Account required argument
 */
export const AccountOptionalArg = Args.string(ParamsAccountOptionalArg);

/**
 * Definition of Account required argument
 */
export const ParamsAccountRequiredArg = {
  ...ParamsAccountOptionalArg,
  required: true,
};

/**
 * Account required argument
 */
export const AccountRequiredArg = Args.string(ParamsAccountRequiredArg);
