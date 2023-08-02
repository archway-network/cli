import { Flags } from '@oclif/core';
import { AlphabetLowercase } from '@oclif/core/lib/interfaces';

import { ConfirmationPrompt } from '@/services/Prompts';
import { PromptCanceledError, showPrompt } from '@/ui/Prompt';

const ForceFlagDescription = "Forces execution (don't show confirmation prompt)";

/**
 * Definition of Force flag
 */
export const definitionForceFlag = {
  description: ForceFlagDescription,
  char: 'f' as AlphabetLowercase,
};

/**
 * Force flag
 */
export const forceFlag = Flags.boolean(definitionForceFlag);

/**
 * Helper function to ask for confirmation
 *
 * @param force - Optional - skips the confirmation prompt
 */
export const askForConfirmation = async (force = false): Promise<void> => {
  if (!force) {
    const result = await showPrompt(ConfirmationPrompt);

    if (!result.confirm) throw new PromptCanceledError();
  }
};
