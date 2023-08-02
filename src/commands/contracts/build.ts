import { Flags } from '@oclif/core';

import { BaseCommand } from '@/lib/base';
import { contractNameRequired } from '@/arguments';
import { Config } from '@/domain';
import { cyan } from '@/utils';

/**
 * Command 'contracts build'
 * Build the contract's WASM file and its schemas
 */
export default class ContractsBuild extends BaseCommand<typeof ContractsBuild> {
  static summary = "Builds the contract's WASM file (or an optimized version of it), and its schemas";
  static args = {
    contract: contractNameRequired,
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
    const config = await Config.open();

    await config.contractsInstance.assertValidWorkspace();

    if (this.flags.optimize) {
      this.log(`Building optimized wasm file for ${this.args.contract}...`);

      const resultPath = await config.contractsInstance.optimize(this.args.contract!);
      this.success(`Optimized Wasm binary saved to ${cyan(resultPath)}}}`);
    } else {
      this.log(`Building the project ${this.args.contract}...`);
      const resultPath = await config.contractsInstance.build(this.args.contract!);
      this.success(`Wasm binary saved to ${cyan(resultPath)}}}`);
    }

    if (this.flags.schemas) {
      await config.contractsInstance.schemas(this.args.contract!);
      this.success('Schemas generated');
    }
  }
}
