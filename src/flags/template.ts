import { Flags } from '@oclif/core';
import { CustomOptions, DefaultContext } from '@oclif/core/lib/interfaces/parser';

import { ContractTemplates, Prompts } from '@/services';

const TemplateFlagDescription = 'Template name';

/**
 * Util function to prompt the user for a template if it is not provided
 *
 * @param _input - Oclif context, not used
 * @param isWritingManifest - Optional - Sometimes Oclif tries to cache the default, to avoid it from triggering multiple prompts, we verify that this variable is undefined
 * @returns Promise containing the template value if prompted
 */
const inputTemplateName = async (_input: DefaultContext<CustomOptions>, isWritingManifest?: boolean): Promise<string | undefined> => {
  if (isWritingManifest === undefined) {
    const promptedTemplate = await Prompts.template();
    return promptedTemplate?.template as string;
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
 * Definition of Template value flag that displays a prompt if it is not found
 */
export const ParamsTemplateWithPromptFlag = {
  description: TemplateFlagDescription,
  default: inputTemplateName,
  parse: validateTemplateName,
};

/**
 * Template value flag that displays a prompt if it is not found
 */
export const TemplateWithPromptFlag = Flags.string(ParamsTemplateWithPromptFlag);
