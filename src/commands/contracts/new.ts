import { Flags } from '@oclif/core';

import { BaseCommand } from '@/lib/base';
import { ContractNameRequiredArg } from '@/parameters/arguments';
import { TemplateWithPromptFlag } from '@/parameters/flags';
import { Config, DEFAULT_TEMPLATE_NAME } from '@/domain';
import { darkGreen, green } from '@/utils';

/**
 * Command 'contracts new'
 * Initializes a new smart contract from a template
 */
export default class ContractsNew extends BaseCommand<typeof ContractsNew> {
  static summary = 'Scaffolds a new Smart Contract from a template';
  static args = {
    contract: ContractNameRequiredArg,
  };

  static flags = {
    template: TemplateWithPromptFlag,
  };

  /**
   * Override init function to show message before prompts are displayed
   */
  public async init(): Promise<void> {
    // Need to parse early to display the contract name on the starting message
    const { args } = await this.parse({
      args: this.ctor.args,
      // Override template flag on this early parse, to avoid early prompting
      flags: { ...this.ctor.flags, template: Flags.string() },
    });

    this.log(`Creating new contract ${args.contract}...\n`);

    await super.init();
  }

  /**
   * Runs the command.
   *
   * @returns Empty promise
   */
  public async run(): Promise<void> {
    const config = await Config.init();

    await config.assertIsValidWorkspace();

    await config.contractsInstance.create(this.args.contract!, this.flags.template || DEFAULT_TEMPLATE_NAME);

    await this.successMessage(this.args.contract!, this.flags.template);
  }

  protected async successMessage(contractName: string, template?: string): Promise<void> {
    this.success(
      `${darkGreen('Contract')} ${green(contractName)} ${darkGreen('created from template')} ${green(template || DEFAULT_TEMPLATE_NAME)}`
    );
  }
}
