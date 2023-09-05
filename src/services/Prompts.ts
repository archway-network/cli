/* eslint-disable unicorn/no-static-only-class */
import { Choice } from 'prompts';

import { ChainRegistry, DEFAULT_CHAIN_ID } from '@/domain';
import { showPrompt } from '@/ui';
import { ContractTemplates } from '@/services';
import { sanitizeDirName } from '@/utils';

import { CosmosChain } from '@/types';

const ChainPromptDetails: Record<string, Partial<Choice>> = {
  'constantine-3': { description: 'Stable testnet - recommended for dApp development' },
  'archway-1': { description: 'Production network' },
};

export class Prompts {
  /**
   * Shows a terminal prompt asking the user to select a chain
   *
   * @returns Promise containing the chain id
   */
  static async chain(): Promise<string> {
    const chainRegistry = await ChainRegistry.init();

    const choices = chainRegistry.listChains.map((item: CosmosChain) => {
      return {
        title: item?.pretty_name || item?.chain_name || '',
        description: ChainPromptDetails[item.chain_id]?.description,
        value: item?.chain_id,
        disabled: ChainPromptDetails[item.chain_id]?.disabled,
      };
    });

    const defaultSelected = choices.findIndex(item => item.value === DEFAULT_CHAIN_ID);

    const answer = await showPrompt({
      type: 'select',
      name: 'chain',
      message: 'Select a chain to use',
      warn: 'This network is unavailable for now',
      initial: defaultSelected === -1 ? undefined : defaultSelected,
      choices,
    });

    return answer.chain;
  }

  /**
   * Shows a terminal prompt asking the user to enter a contract name
   *
   * @returns Promise containing the contract name
   */
  static async contractName(): Promise<string> {
    const answer = await showPrompt({
      type: 'text',
      name: 'contract-name',
      message: 'Choose a name for your contract',
      validate: value => Boolean(value.toString().trim()),
    });

    return answer['contract-name'];
  }

  /**
   * Shows a terminal prompt asking the user the user for a template after confirmation
   *
   * @returns Promise containing the template name
   */
  static async template(): Promise<string> {
    const answer = await showPrompt({
      type: 'select',
      name: 'template',
      message: 'Choose a starter template',
      choices: ContractTemplates?.getTemplateChoices?.() || [],
    });

    return answer.template;
  }

  /**
   * Shows a terminal prompt asking the user the user for an account password
   *
   * @param nameOrAddress - Name or address of the account
   * @returns Promise containing the {@link Answers} object containing the account password
   */
  static async accountPassword(nameOrAddress: string): Promise<string> {
    const answer = await showPrompt({
      type: 'password',
      name: 'password',
      message: `Enter the password for the account ${nameOrAddress}`,
    });

    return answer.password;
  }

  /**
   * Shows a terminal prompt asking the user the user for confirmation
   *
   * @returns Promise containing the {@link Answers} object containing confirmation
   */
  static async confirmation(): Promise<boolean> {
    const answer = await showPrompt({
      type: 'confirm',
      name: 'confirm',
      message: 'Do you want to proceed?',
      initial: false,
    });

    return answer.confirm;
  }

  /**
   * Shows a terminal prompt asking the user the user for a signer account for a transaction
   *
   * @returns Promise containing the {@link Answers} object containing the account name or address
   */
  static async fromAccount(): Promise<string> {
    const answer = await showPrompt({
      type: 'text',
      name: 'from',
      message: 'Enter the name or address of the account that will send the transaction',
      validate: value => Boolean(value.toString().trim()),
    });

    return answer.from;
  }

  /**
   * Shows a terminal prompt asking the user the user for a new account name
   *
   * @returns Promise containing the {@link Answers} object containing the new account name
   */
  static async newAccount(): Promise<string> {
    const answer = await showPrompt({
      type: 'text',
      name: 'account-name',
      message: 'Enter the name of the new account',
      validate: value => Boolean(value.toString().trim()),
    });

    return answer['account-name'];
  }

  /**
   * Shows a terminal prompt asking the user the user for a new project name
   *
   * @returns Promise containing the {@link Answers} object containing the new project name
   */
  static async newProject(): Promise<string> {
    const answer = await showPrompt({
      type: 'text',
      name: 'project-name',
      message: 'Enter the name of the new project',
      validate: value => Boolean(value.toString().trim()),
      format: value => sanitizeDirName(value)
    });

    return answer['project-name'];
  }

  /**
   * Shows a terminal prompt asking the user the user for a new contract name
   *
   * @returns Promise containing the {@link Answers} object containing the new contract name
   */
  static async newContract(): Promise<string> {
    const answer = await showPrompt({
      type: 'text',
      name: 'contract-name',
      message: 'Enter the name of the new contract',
      validate: value => Boolean(value.toString().trim()),
      format: value => sanitizeDirName(value)
    });

    return answer['contract-name'];
  }
}