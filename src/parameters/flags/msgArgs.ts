import fs from 'node:fs/promises';

import { Flags, Interfaces } from '@oclif/core';
import _ from 'lodash';

import { NotFoundError, OnlyOneArgSourceError } from '@/exceptions';
import { StdinInputArg } from '@/parameters/arguments';
import { JsonObject } from '@/types';

export const ContractMsgArg = {
  stdinInput: StdinInputArg
};

export const ContractMsgFlags = {
  args: Flags.string({
    description: 'JSON string with the message to send the smart contract',
    exclusive: ['args-file', 'stdin-input'],
  }),
  'args-file': Flags.file({
    description: 'Path to a JSON file with a message to send to the smart contract',
    exclusive: ['args', 'stdin-input'],
    exists: true,
  }),
};

type Args = Interfaces.InferredArgs<typeof ContractMsgArg>;
type Flags = Interfaces.InferredFlags<typeof ContractMsgFlags>;

/**
 * Parses the contract message arguments as a JSON from the command.
 *
 * @param args - The args from the command
 * @param flags - The flags from the command
 * @param mandatory - If the args are mandatory or not
 * @returns Promise containing the parsed JSON object
 */
export async function parseContractMsgArgs(args: Args, flags: Flags, mandatory = true): Promise<JsonObject> {
  validate(args, flags, mandatory);

  if (args.stdinInput || flags.args || flags['args-file']) {
    const json = args.stdinInput || flags.args || (await fs.readFile(flags['args-file']!, 'utf8'));
    return JSON.parse(json) as JsonObject;
  }

  return {};
}

/**
 * Validates that we only get args from one source of all 3 possible inputs
 *
 * @param args - The args from the command
 * @param flags - The flags from the command
 * @param mandatory - If the args are mandatory or not
 *
 * @throws A {@link OnlyOneArgSourceError} If we get args from more than one source
 * @throws A {@link NotFoundError} If we don't get args from any source
 */
function validate(args: Args, flags: Flags, mandatory: boolean): void {
  const filteredArgs = _.compact([args.stdinInput, flags.args, flags['args-file']]);

  if (mandatory && filteredArgs.length === 0) {
    throw new NotFoundError('Contract message arguments', '--args, --args-file or stdin');
  }

  if (filteredArgs.length > 1) {
    throw new OnlyOneArgSourceError(['--args', '--args-file', 'stdin']);
  }
}
