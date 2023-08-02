import { Args, Flags } from '@oclif/core';

import { BaseCommand } from '@/lib/base';
import { ChainWithPromptFlag } from '@/flags';
import { Prompts, SuccessMessages } from '@/services';
import { NewProject as NewProjectDomain } from '@/domain';
import { DEFAULT } from '@/GlobalConfig';

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
    chain: ChainWithPromptFlag,
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

    let promptedContractName: Record<string, string> = {};
    let promptedTemplate: Record<string, string> = {};

    if (!this.flags['contract-name']) promptedContractName = await Prompts.contractName();
    if (!this.flags.template) promptedTemplate = await Prompts.template();

    await NewProjectDomain.create({
      name: this.args['project-name'],
      contractTemplate: this.flags['no-contract'] ? undefined : this.flags.template || promptedTemplate?.template || DEFAULT.Template,
      chainId: this.flags.chain as string,
      contractName: (this.flags['contract-name'] || promptedContractName?.['contract-name']) as string,
    });

    SuccessMessages.new(this, this.args['project-name'], this.flags.chain!);
  }
}
