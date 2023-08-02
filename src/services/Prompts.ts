/* eslint-disable unicorn/no-static-only-class */
import { Answers, Choice } from 'prompts';

import { DEFAULT } from '@/GlobalConfig';
import { ChainRegistry } from '@/domain';
import { showPrompt } from '@/ui';
import { ContractTemplates } from '@/services';

import { CosmosChain } from '@/types';

const ChainPromptDetails: Record<string, Partial<Choice>> = {
  'constantine-3': { description: 'Stable testnet - recommended for dApp development' },
  'titus-1': { description: 'Nightly releases - chain state can be cleared at any time' },
};

export class Prompts {
  /**
   * Shows a terminal prompt asking the user to select a chain
   *
   * @returns Promise containing the {@link Answers} object containing the chain
   */
  static async chain(): Promise<Answers<'chain'>> {
    const chainRegistry = await ChainRegistry.init();

    const choices = chainRegistry.listChains.map((item: CosmosChain) => {
      return {
        title: item?.pretty_name || item?.chain_name || '',
        description: ChainPromptDetails[item.chain_id]?.description,
        value: item?.chain_id,
        disabled: ChainPromptDetails[item.chain_id]?.disabled,
      };
    });

    const defaultSelected = choices.findIndex(item => item.value === DEFAULT.ChainId);

    return showPrompt({
      type: 'select',
      name: 'chain',
      message: 'Select a chain to use',
      warn: 'This network is unavailable for now',
      initial: defaultSelected === -1 ? undefined : defaultSelected,
      choices,
    });
  }

  /**
   * Shows a terminal prompt asking the user to enter a contract name
   *
   * @returns Promise containing the {@link Answers} object containing the contract name
   */
  static async contractName(): Promise<Answers<'contract-name'>> {
    return showPrompt({
      type: 'text',
      name: 'contract-name',
      message: 'Choose a name for your contract',
      validate: value => Boolean(value),
    });
  }

  /**
   * Shows a terminal prompt asking the user the user for a template after confirmation
   *
   * @returns Promise containing the {@link Answers} object containing the template name
   */
  static async template(): Promise<Answers<'use-template' | 'template'>> {
    return showPrompt([
      {
        type: 'confirm',
        name: 'use-template',
        message: 'Do you want to use a starter template?',
        initial: false,
      },
      {
        type: prev => (prev ? 'select' : null),
        name: 'template',
        message: 'Choose a template',
        choices: ContractTemplates?.getTemplateChoices?.() || [],
      },
    ]);
  }

  /**
   * Shows a terminal prompt asking the user the user for an account password
   *
   * @param nameOrAddress - Name or address of the account
   * @returns Promise containing the {@link Answers} object containing the account password
   */
  static async accountPassword(nameOrAddress: string): Promise<Answers<'password'>> {
    return showPrompt({
      type: 'password',
      name: 'password',
      message: `Enter the password for the account ${nameOrAddress}`,
    });
  }

  /**
   * Shows a terminal prompt asking the user the user for confirmation
   *
   * @returns Promise containing the {@link Answers} object containing confirmation
   */
  static async confirmation(): Promise<Answers<'confirm'>> {
    return showPrompt({
      type: 'confirm',
      name: 'confirm',
      message: 'Do you want to proceed?',
      initial: false,
    });
  }

  /**
   * Shows a terminal prompt asking the user the user for a signer account for a transaction
   *
   * @returns Promise containing the {@link Answers} object containing the account name or address
   */
  static async fromAccount(): Promise<Answers<'from'>> {
    return showPrompt({
      type: 'text',
      name: 'from',
      message: 'Enter the name or address of the account that will send the transaction',
      validate: value => Boolean(value),
    });
  }
}
