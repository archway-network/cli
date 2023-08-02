import { Flags } from '@oclif/core';
import { CustomOptions, DefaultContext } from '@oclif/core/lib/interfaces/parser';

import { TemplatePrompt } from '@/services/Prompts';
import { showPrompt } from '@/ui/Prompt';
import { ContractTemplates } from '@/domain/ContractTemplates';

const TemplateFlagDescription = 'Template name';

/**
 * Util function to prompt the user for a template if it is not provided
 *
 * @param _input - Oclif context, not used
 * @param isWritingManifest - Optional - Sometimes Oclif tries to cache the default, to avoid it from triggering multiple prompts, we verify that this variable is undefined
 * @returns Promise containing the template value if prompted
 */
const getTemplateName = async (_input: DefaultContext<CustomOptions>, isWritingManifest?: boolean): Promise<string | undefined> => {
  if (isWritingManifest === undefined) {
    const response = await showPrompt(TemplatePrompt);
    return response.template as string;
  }
};

/**
 * Util function to validate if a template value exists, throws error if not
 * @param value - Template value to validate
 * @returns Promise containing the template value
 */
const validateTemplateName = async (value: string): Promise<string> => {
  ContractTemplates.assertIsValidTemplate(value);

  return value;
};

/**
 * Template value flag that displays a prompt if it is not found
 */
export const templateWithPrompt = Flags.custom<string>({
  description: TemplateFlagDescription,
  default: getTemplateName,
  parse: validateTemplateName,
});
