import { Flags } from '@oclif/core';
import { CustomOptions, DefaultContext } from '@oclif/core/lib/interfaces/parser';

import { getChainPrompt } from '@/services/Prompts';
import { showPrompt } from '@/ui/Prompt';
import { ChainRegistry } from '@/domain/ChainRegistry';

const ChainFlagDescription = 'ID of the chain';

/**
 * Util function to prompt the user for a chain id if it is not provided
 *
 * @param _input - Oclif context, not used
 * @param isWritingManifest - Optional - Sometimes Oclif tries to cache the default, to avoid it from triggering multiple prompts, we verify that this variable is undefined
 * @returns Promise containing the chain id value if prompted
 */
const getChainId = async (_input: DefaultContext<CustomOptions>, isWritingManifest?: boolean): Promise<string | undefined> => {
  if (isWritingManifest === undefined) {
    const chainPrompt = await getChainPrompt();
    const response = await showPrompt(chainPrompt);
    return response.chain as string;
  }
};

/**
 * Util function to validate if a chain id exists, throws error if not
 * @param value - Chain id to validate
 * @returns Promise containing the chain id
 */
const validateChainId = async (value: string): Promise<string> => {
  const chainRegistry = await ChainRegistry.init();
  chainRegistry.assertGetChainById(value);

  return value;
};

/**
 * Chain id flag that displays a prompt if value is not found
 */
export const chainWithPrompt = Flags.string({
  description: ChainFlagDescription,
  default: getChainId,
  parse: validateChainId,
});

/**
 * Chain id flag that is optional
 */
export const chainOptional = Flags.string({
  description: ChainFlagDescription,
  parse: validateChainId,
});

/**
 * Chain id flag that is required
 */
export const chainRequired = Flags.string({
  description: ChainFlagDescription,
  parse: validateChainId,
  required: true,
});
