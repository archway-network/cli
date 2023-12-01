import { Choice } from 'prompts';

import { ChainRegistry, DEFAULT_CHAIN_ID } from '@/domain';
import { CosmosChain } from '@/types';
import { PromptCanceledError, showPrompt } from '@/ui';
import { blueBright, sanitizeDirName } from '@/utils';

import { ContractTemplates } from './ContractTemplates';

const ChainPromptDetails: Record<string, Partial<Choice>> = {
  'constantine-3': { description: 'Stable testnet - recommended for dapp development' },
  'archway-1': { description: 'Production network' },
};

export namespace Prompts {
  /**
   * Shows a terminal prompt asking the user to select a chain
   *
   * @returns Promise<string> containing the chain id
   */
  export async function chain(): Promise<string> {
    const chainRegistry = await ChainRegistry.init();

    const choices = chainRegistry.chains.map((item: CosmosChain) => {
      return {
        title: item.pretty_name || item.chain_name || item.chain_id,
        description: ChainPromptDetails[item.chain_id]?.description || item.chain_id,
        value: item.chain_id,
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
   * @returns Promise<string> containing the contract name
   */
  export async function contractName(): Promise<string> {
    const answer = await showPrompt({
      type: 'text',
      name: 'contract-name',
      message: 'Choose a name for your contract',
      validate: value => Boolean(value.toString().trim()),
    });

    return answer['contract-name'];
  }

  /**
   * Shows a terminal prompt asking the user for a template after confirmation
   *
   * @returns Promise<string> containing the template name
   */
  export async function template(): Promise<string> {
    const answer = await showPrompt({
      type: 'select',
      name: 'template',
      message: 'Choose a starter template',
      choices: ContractTemplates?.getTemplateChoices?.() || [],
    });

    return answer.template;
  }

  /**
   * Shows a terminal prompt asking the user for an account password
   *
   * @param nameOrAddress - Name or address of the account
   * @returns Promise<string> containing the password
   */
  export async function accountPassword(nameOrAddress: string): Promise<string> {
    const answer = await showPrompt({
      type: 'password',
      name: 'password',
      message: `Enter the password for the account ${blueBright(nameOrAddress)}`,
    });

    return answer.password;
  }

  /**
   * Shows a terminal prompt asking the user for confirmation
   *
   * @returns Promise<boolean> object containing confirmation
   */
  export async function confirmation(): Promise<boolean> {
    const answer = await showPrompt({
      type: 'confirm',
      name: 'confirm',
      message: 'Do you want to proceed?',
      initial: false,
      stdout: process.stderr,
    });

    return answer.confirm;
  }

  /**
   * Shows a terminal prompt asking the user for a signer account for a transaction
   *
   * @returns Promise<string> containing the account name or address
   */
  export async function fromAccount(): Promise<string> {
    const answer = await showPrompt({
      type: 'text',
      name: 'from',
      message: 'Enter the name or address of the account that will send the transaction',
      validate: value => Boolean(value.toString().trim()),
    });

    return answer.from;
  }

  /**
   * Shows a terminal prompt asking the user for a new account name
   *
   * @returns Promise<string> containing the new account name
   */
  export async function newAccount(): Promise<string> {
    const answer = await showPrompt({
      type: 'text',
      name: 'account-name',
      message: 'Enter the name of the new account',
      validate: value => Boolean(value.toString().trim()),
    });

    return answer['account-name'];
  }

  /**
   * Shows a terminal prompt asking the user for a new project name
   *
   * @returns Promise<string> containing the new project name
   */
  export async function newProject(): Promise<string> {
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
   * Shows a terminal prompt asking the user for a new contract name
   *
   * @returns Promise<string> containing the new contract name
   */
  export async function newContract(): Promise<string> {
    const answer = await showPrompt({
      type: 'text',
      name: 'contract-name',
      message: 'Enter the name of the new contract',
      validate: value => Boolean(value.toString().trim()),
      format: value => sanitizeDirName(value)
    });

    return answer['contract-name'];
  }

  /**
   * Shows a terminal prompt asking the user for a mnemonic or private key
   *
   * @returns Promise<string> containing the mnemonic or private key
   */
  export async function mnemonicOrPrivateKey(): Promise<string> {
    const answer = await showPrompt({
      type: 'text',
      name: 'mnemonicOrPrivateKey',
      message: 'Please enter the mnemonic or private key to recover',
    });

    return answer.mnemonicOrPrivateKey;
  }

  /**
   * Util function to ask for confirmation
   *
   * @param force - Optional - Skips the confirmation prompt
   */
  export async function askForConfirmation(force = false): Promise<void> {
    if (force) {
      return;
    }

    const promptedConfirmation = await Prompts.confirmation();
    if (!promptedConfirmation) {
      throw new PromptCanceledError();
    }
  }
}
