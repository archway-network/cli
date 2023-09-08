import { Args, Flags } from '@oclif/core';
import { spawn } from 'promisify-child-process';

import { BaseCommand } from '@/lib/base';
import { ChainOptionalFlag } from '@/parameters/flags';
import { Prompts } from '@/services';
import { NewProject as NewProjectDomain, ProjectType } from '@/domain';
import { green, greenBright, sanitizeDirName } from '@/utils';

/**
 * Command 'new'
 * Initializes a config file for the current project
 */
export default class NewProject extends BaseCommand<typeof NewProject> {
  static summary = 'Initializes a new project repository';
  static args = {
    'project-name': Args.string({ description: 'Name of the new repository' }),
  };

  static flags = {
    chain: ChainOptionalFlag,
    contract: Flags.boolean({
      default: true,
      description: 'Boolean flag to choose if you want to also create a contract with the project. Defaults to true',
    }),
    'contract-name': Flags.string({ description: 'Name of the contract' }),
    template: Flags.string({ description: 'Template of the contract to be created with your project' }),
  };

  /**
   * Runs the command.
   *
   * @returns Empty promise
   */
  public async run(): Promise<void> {
    const inputProjectName = sanitizeDirName(this.args['project-name'] || (await Prompts.newProject()));
    const inputChain = this.flags.chain || (await Prompts.chain());

    const contractName = this.flags.contract ? sanitizeDirName(this.flags['contract-name'] || (await Prompts.contractName())) : undefined;
    const contractTemplate = this.flags.contract ? this.flags.template || (await Prompts.template()) : undefined;

    this.log(`Creating Archway project ${inputProjectName}...\n`);

    const projectName = await NewProjectDomain.create(
      {
        name: inputProjectName,
        chainId: inputChain,
        contractName,
        contractTemplate,
      },
      ProjectType.RUST,
      this.jsonEnabled()
    );

    process.chdir(projectName);

    await spawn('git', ['init', '--quiet'], {
      stdio: 'inherit',
      encoding: 'utf8',
      maxBuffer: 1024 * 1024,
    });

    await this.successMessage(projectName, inputChain);
  }

  protected async successMessage(projectName: string, chainId: string): Promise<void> {
    this.success(
      `${green('Project')} ${greenBright(projectName)} ${green('created and configured for the chain')} ${greenBright(chainId)}`
    );

    if (this.jsonEnabled()) this.logJson({ name: projectName, 'chain-id': chainId });
  }
}
