import { Flags } from '@oclif/core';

import { BaseCommand } from '@/lib/base';
import { ContractNameRequiredArg } from '@/arguments';
import { TemplateWithPromptFlag } from '@/flags';
import { Config } from '@/domain';
import { DEFAULT } from '@/GlobalConfig';
import { SuccessMessages } from '@/services';

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

    await config.contractsInstance.create(this.args.contract!, this.flags.template || DEFAULT.Template);

    SuccessMessages.contracts.new(this, this.args.contract!, this.flags.template);
  }
}
