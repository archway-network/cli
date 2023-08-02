import { Args, Flags } from '@oclif/core';
import { PromptObject } from 'prompts';

import { BaseCommand } from '@/lib/base';
import { chainWithPrompt } from '@/flags/chain';
import { ContractNamePrompt, TemplatePrompt } from '@/services/Prompts';
import { showPrompt } from '@/ui/Prompt';
import { darkGreen, green } from '@/utils/style';
import { NewProject as NewProjectDomain } from '@/domain/NewProject';
import { DEFAULT } from '@/config';

/**
 * Command 'new'
 * Initializes a config file for the current project
 */
export default class NewProject extends BaseCommand<typeof NewProject> {
  static summary = 'Initializes a new project repository';
  static args = {
    'project-name': Args.string({ required: true }),
  };

  static flags = {
    chain: chainWithPrompt,
    'no-contract': Flags.boolean(),
    'contract-name': Flags.string(),
    template: Flags.string(),
  };

  /**
   * Override init function to show message before prompts are displayed
   */
  public async init(): Promise<void> {
    // Need to parse early to display the project name on the starting message
    const { args } = await this.parse({
      args: this.ctor.args,
      // Override chain flag on this early parse, to avoid early prompting
      flags: { ...this.ctor.flags, chain: Flags.string() },
    });

    this.log(`Creating Archway project ${args['project-name']}...\n`);

    await super.init();
  }

  /**
   * Runs the command.
   *
   * @returns Empty promise
   */
  public async run(): Promise<void> {
    // If no-contract flag then only copy the files
    if (this.flags['no-contract']) return;

    let promptsToDisplay: PromptObject[] = [];

    if (!this.flags['contract-name']) promptsToDisplay.push(ContractNamePrompt);
    if (!this.flags.template) {
      promptsToDisplay = [...promptsToDisplay, ...TemplatePrompt];
    }

    const promptedFlags = promptsToDisplay.length > 0 ? await showPrompt(promptsToDisplay) : {};

    await NewProjectDomain.create({
      name: this.args['project-name'],
      contractTemplate: this.flags['no-contract'] ? undefined : this.flags.template || promptedFlags.template || DEFAULT.Template,
      chainId: this.flags.chain as string,
      contractName: (this.flags['contract-name'] || promptedFlags['contract-name']) as string,
    });

    this.success(
      `${darkGreen('Project')} ${green(this.args['project-name'])} ${darkGreen('created and configured for the chain')} ${green(
        this.flags.chain
      )}`
    );
  }
}
