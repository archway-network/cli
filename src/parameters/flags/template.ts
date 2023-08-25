import { Flags } from '@oclif/core';

const TemplateFlagDescription = 'Template name';

/**
 * Definition of Template optional flag
 */
export const ParamsTemplateOptionalFlag = {
  description: TemplateFlagDescription,
};

/**
 * Template optional flag
 */
export const TemplateOptionalFlag = Flags.string(ParamsTemplateOptionalFlag);
