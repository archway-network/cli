import { Flags } from '@oclif/core';

import { BaseCommand } from '@/lib/base';
import { darkGreen, green } from '@/utils/style';
import { contractNameRequired } from '@/arguments/contract';
import { templateWithPrompt } from '@/flags/template';
import { Config } from '@/domain/Config';
import { DEFAULT } from '@/config';

/**
 * Command 'contracts new'
 * Initializes a new smart contract from a template
 */
export default class ContractsNew extends BaseCommand<typeof ContractsNew> {
  static summary = 'Scaffolds a new Smart Contract from a template';
  static args = {
    contract: contractNameRequired,
  };

  static flags = {
    template: templateWithPrompt(),
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
    const config = await Config.open();

    await config.contractsInstance.assertValidWorkspace();

    await config.contractsInstance.new(this.args.contract!, this.flags.template || DEFAULT.Template);

    this.success(
      `${darkGreen('Contract')} ${green(this.args.contract)} ${darkGreen('created from template')} ${green(
        this.flags.template || DEFAULT.Template
      )}`
    );
  }
}
