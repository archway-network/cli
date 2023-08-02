import { Choice, PromptObject } from 'prompts';

import { DEFAULT } from '@/config';
import { ChainRegistry } from '@/domain/ChainRegistry';
import { CosmosChain } from '@/types/Chain';

const ChainPromptDetails: Record<string, Partial<Choice>> = {
  'constantine-1': { description: 'Stable testnet - recommended for dApp development' },
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

  const choices = chainRegistry.data.map((item: CosmosChain) => {
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
