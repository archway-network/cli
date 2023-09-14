import { Flags } from '@oclif/core';

const NoConfirmDescription = "Don't show confirmation prompt";

/**
 * Definition of no-confirm flag
 */
export const ParamsNoConfirmFlag = {
  description: NoConfirmDescription,
};

/**
 * No-confirm flag
 */
export const NoConfirmFlag = Flags.boolean(ParamsNoConfirmFlag);
