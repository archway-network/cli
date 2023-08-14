import { Flags } from '@oclif/core';

import { BaseCommand } from '@/lib/base';
import { ContractNameRequiredArg } from '@/parameters/arguments';
import { Config } from '@/domain';
import { cyan } from '@/utils';

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

    await config.assertIsValidWorkspace();
    if (this.flags.optimize) {
      this.log(`Building optimized wasm file for ${this.args.contract}...`);

      const resultPath = await config.contractsInstance.optimize(this.args.contract!);
      await this.successMessage(SuccessMessageType.OPTIMIZE, resultPath);
    } else {
      this.log(`Building the project ${this.args.contract}...`);
      const resultPath = await config.contractsInstance.build(this.args.contract!);
      await this.successMessage(SuccessMessageType.DEFAULT, resultPath);
    }

    if (this.flags.schemas) {
      await config.contractsInstance.schemas(this.args.contract!);
      await this.successMessage(SuccessMessageType.SCHEMAS);
    }
  }

  protected async successMessage(type: SuccessMessageType, outputPath?: string): Promise<void> {
    switch (type) {
      case SuccessMessageType.DEFAULT:
        this.success(`Wasm binary saved to ${cyan(outputPath)}}}`);

        break;
      case SuccessMessageType.OPTIMIZE:
        this.success(`Optimized Wasm binary saved to ${cyan(outputPath)}}}`);

        break;
      case SuccessMessageType.SCHEMAS:
        this.success('Schemas generated');

        break;
    }
  }
}

enum SuccessMessageType {
  OPTIMIZE = 'optimize',
  DEFAULT = 'default',
  SCHEMAS = 'schemas',
}
