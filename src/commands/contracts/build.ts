import { Flags } from '@oclif/core';

import { BaseCommand } from '@/lib/base';
import { ContractNameRequiredArg } from '@/arguments';
import { Config } from '@/domain';
import { SuccessMessages } from '@/services';

/**
 * Command 'contracts build'
 * Build the contract's WASM file and its schemas
 */
export default class ContractsBuild extends BaseCommand<typeof ContractsBuild> {
  static summary = "Builds the contract's WASM file (or an optimized version of it), and its schemas";
  static args = {
    contract: ContractNameRequiredArg,
  };

  static flags = {
    schemas: Flags.boolean({ default: false }),
    optimize: Flags.boolean({ default: false }),
  };

  /**
   * Runs the command.
   *
   * @returns Empty promise
   */
  public async run(): Promise<void> {
    const config = await Config.init();

    await config.contractsInstance.assertValidWorkspace();

    if (this.flags.optimize) {
      this.log(`Building optimized wasm file for ${this.args.contract}...`);

      const resultPath = await config.contractsInstance.optimize(this.args.contract!);
      SuccessMessages.contracts.build.optimize(this, resultPath);
    } else {
      this.log(`Building the project ${this.args.contract}...`);
      const resultPath = await config.contractsInstance.build(this.args.contract!);
      SuccessMessages.contracts.build.default(this, resultPath);
    }

    if (this.flags.schemas) {
      await config.contractsInstance.schemas(this.args.contract!);
      SuccessMessages.contracts.build.schemas(this);
    }
  }
}
