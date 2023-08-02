import { Args } from '@oclif/core';

/**
 * Definition of Contract name required argument
 */
export const definitionStdinInput = {
  name: 'piped',
  required: false,
  hidden: true,
};

/**
 * Contract name required argument
 */
export const stdinInput = Args.string(definitionStdinInput);
