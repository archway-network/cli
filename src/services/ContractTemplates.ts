import { Choice } from 'prompts';

import { TEMPLATES_REPOSITORY } from '@/domain';
import { InvalidValueError } from '@/exceptions';
import { ContractTemplate } from '@/types';

/**
 * Contract templates to be used in generated projects
 */
// eslint-disable-next-line unicorn/no-static-only-class
export class ContractTemplates {
  /**
   * An array containing all the templates
   */
  static allTemplates: ContractTemplate[] = [
    { title: 'Increment', value: 'increment' },
    { title: 'CW20', value: 'cw20/base' },
    { title: 'CW20 escrow', value: 'cw20/escrow' },
    { title: 'CW721 with on-chain metadata', value: 'cw721/on-chain-metadata' },
  ];

  /**
   * Get the list of templates in a format that is useful as a prompt to the user
   *
   * @returns Array of {@link Choice} objects to be used as prompts
   */
  static getTemplateChoices(): Choice[] {
    return this.allTemplates.map(item => {
      return {
        ...item,
        description: `[https://github.com/${TEMPLATES_REPOSITORY}/tree/main/${item.value}]`,
      };
    });
  }

  /**
   * Gets only the values of the templates
   *
   * @returns Array of strings, containing the values of the templates
   */
  static getTemplateValues(): string[] {
    return this.allTemplates.map(item => item.value);
  }

  /**
   * Verify if a template value is valid, throws error if not
   *
   * @param value - Template value to validate
   * @returns void
   */
  static assertIsValidTemplate(value: string): void {
    if (!this.isValidTemplate(value)) {
      throw new InvalidValueError(value, 'Template');
    }
  }

  /**
   * Verify if a template value is valid
   *
   * @param value - Template value to validate
   * @returns Boolean, whether it is valid or not
   */
  static isValidTemplate(value: string): boolean {
    return this.getTemplateValues().includes(value);
  }
}
