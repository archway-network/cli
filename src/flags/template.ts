import { Flags } from '@oclif/core';
import { CustomOptions, DefaultContext } from '@oclif/core/lib/interfaces/parser';

import { TemplatePrompt } from '@/services/Prompts';
import { showPrompt } from '@/ui/Prompt';
import { ContractTemplates } from '@/domain/ContractTemplates';

const TemplateFlagDescription = 'Template name';

/**
 * Util function to prompt the user for a template if it is not provided
 *
 * @param input - Oclif context
 * @returns Promise containing the template value if prompted
 */
const getTemplateName = async (input: DefaultContext<CustomOptions>): Promise<string | undefined> => {
  if (input?.options?.name) {
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
