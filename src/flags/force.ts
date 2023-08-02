import { Flags } from '@oclif/core';

import { confirmationPrompt } from '@/services/Prompts';
import { PromptCanceledError, showPrompt } from '@/ui/Prompt';

const ForceFlagDescription = "Forces execution (don't show confirmation prompt)";

/**
 * Force flag
 */
export const forceFlag = Flags.custom<boolean>({
  description: ForceFlagDescription,
  char: 'f',
});

export const askForConfirmation = async (force = false): Promise<void> => {
  if (!force) {
    const result = await showPrompt(confirmationPrompt);

    if (!result.confirm) throw new PromptCanceledError();
  }
};
