import { Flags } from '@oclif/core';
import { getChainPrompt } from '../services/Prompts';
import { showPrompt } from '../ui/Prompt';
import { ChainRegistry } from '../domain/ChainRegistry';
import { CustomOptions, DefaultContext } from '@oclif/core/lib/interfaces/parser';

const ChainFlagDescription = 'ID of the chain';

const getChainId = async (input: DefaultContext<CustomOptions>): Promise<string | undefined> => {
  if (input?.options?.name) {
    const chainPrompt = await getChainPrompt();
    const response = await showPrompt(chainPrompt);
    return response.chain as string;
  }
};

const validateChainId = async (value: string): Promise<string> => {
  const chainRegistry = await ChainRegistry.init();
  chainRegistry.assertGetChainById(value);

  return value;
};

export const chainWithPrompt = Flags.custom<string>({
  description: ChainFlagDescription,
  default: getChainId,
  parse: validateChainId,
});

export const chainOptional = Flags.custom<string>({
  description: ChainFlagDescription,
  parse: validateChainId,
});

export const chainRequired = Flags.custom<string>({
  description: ChainFlagDescription,
  parse: validateChainId,
  required: true
});
