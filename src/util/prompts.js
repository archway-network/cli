const _ = require('lodash');
const { prompt, prompts, inject, override } = require('prompts');

class PromptCancelledError extends Error { }

async function promptWrapper(questions, { onSubmit = _.noop } = {}) {
  const onCancel = () => { throw new PromptCancelledError('Cancelled'); };
  return await prompt(questions, { onSubmit, onCancel })
}

module.exports = {
  prompts: Object.assign(promptWrapper, { prompt: promptWrapper, prompts, inject, override }),
  PromptCancelledError
};
