import { Choice, PromptObject } from 'prompts';
import { Chain } from '../../services/Chain';

const ChainDetails: Record<string, Partial<Choice>> = {
  'constantine-1': { description: 'Stable testnet - recommended for dApp development' },
  'titus-1': { description: 'Nightly releases - chain state can be cleared at any time' },
};
const Chains: Choice[] = Chain.getChainIds().map((id: string) => {
  const chainInfo = Chain.getChainById(id);

  return {
    title: chainInfo?.pretty_name || '',
    description: ChainDetails[id]?.description,
    value: chainInfo?.chain_id,
    disabled: ChainDetails[id]?.disabled,
  };
});
const DefaultChain = 'constantine-1';

export const ChainPrompt: PromptObject = {
  type: 'select',
  name: 'chain',
  message: 'Select a chain to use',
  initial: Chains.findIndex(item => item.value === DefaultChain),
  choices: Chains,
  warn: 'This network is unavailable for now',
};
