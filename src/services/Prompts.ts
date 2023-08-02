import { Choice, PromptObject } from 'prompts';

import { DEFAULT } from '@/config';
import { ChainRegistry } from '@/domain/ChainRegistry';
import { CosmosChain } from '@/types/Chain';
import { ContractTemplates } from '@/domain/ContractTemplates';

const ChainPromptDetails: Record<string, Partial<Choice>> = {
  'constantine-2': { description: 'Stable testnet - recommended for dApp development' },
  'titus-1': { description: 'Nightly releases - chain state can be cleared at any time' },
};

const BaseChainPrompt: PromptObject = {
  type: 'select',
  name: 'chain',
  message: 'Select a chain to use',
  warn: 'This network is unavailable for now',
};

/**
 * Builds the terminal prompt to ask the user to select a chain
 *
 * @returns Promise containing the {@link PromptObject} to be used with the 'prompts' library
 */
export const getChainPrompt = async (): Promise<PromptObject> => {
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

  return {
    ...BaseChainPrompt,
    initial: defaultSelected === -1 ? undefined : defaultSelected,
    choices,
  };
};

/**
 * Terminal prompt to ask the user for a contract name
 */
export const ContractNamePrompt: PromptObject = {
  type: 'text',
  name: 'contract-name',
  message: 'Choose a name for your contract',
  validate: value => Boolean(value),
};

/**
 * Terminal prompt to ask the user for a template after confirmation
 */
export const TemplatePrompt: PromptObject[] = [
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
    choices: ContractTemplates.getTemplateChoices(),
  },
];

/**
 * Terminal prompt to ask the user for an account password
 */
export const getAccountPasswordPrompt = (nameOrAddress: string): PromptObject => {
  return {
    type: 'text',
    name: 'password',
    message: `Enter the password for the account ${nameOrAddress}`,
  };
};

/**
 * Terminal prompt to ask the user for an account password
 */
export const confirmationPrompt: PromptObject = {
  type: 'confirm',
  name: 'confirm',
  message: 'Do you want to proceed?',
  initial: false,
};
