import { Choice, PromptObject } from 'prompts';
import { DEFAULT } from '../config';
import { BuiltInChains } from './BuiltInChains';

const ChainPromptDetails: Record<string, Partial<Choice>> = {
  'constantine-1': { description: 'Stable testnet - recommended for dApp development' },
  'titus-1': { description: 'Nightly releases - chain state can be cleared at any time' },
};

const ChainListForPrompt: Choice[] = BuiltInChains.getChainIds().map((id: string) => {
  const chainInfo = BuiltInChains.getChainById(id);

  return {
    title: chainInfo?.pretty_name || '',
    description: ChainPromptDetails[id]?.description,
    value: chainInfo?.chain_id,
    disabled: ChainPromptDetails[id]?.disabled,
  };
});

export const ChainPrompt: PromptObject = {
  type: 'select',
  name: 'chain',
  message: 'Select a chain to use',
  initial: ChainListForPrompt.findIndex(item => item.value === DEFAULT.ChainId),
  choices: ChainListForPrompt,
  warn: 'This network is unavailable for now',
};
