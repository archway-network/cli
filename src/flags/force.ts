import { Flags } from '@oclif/core';

import { ConfirmationPrompt } from '@/services/Prompts';
import { PromptCanceledError, showPrompt } from '@/ui/Prompt';

const ForceFlagDescription = "Forces execution (don't show confirmation prompt)";

/**
 * Force flag
 */
export const forceFlag = Flags.boolean({
  description: ForceFlagDescription,
  char: 'f',
});

export const askForConfirmation = async (force = false): Promise<void> => {
  if (!force) {
    const result = await showPrompt(ConfirmationPrompt);

    if (!result.confirm) throw new PromptCanceledError();
  }
};
