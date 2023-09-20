import { BaseCommand } from '@/lib/base';
import { ContractNameRequiredArg } from '@/parameters/arguments';
import { Config } from '@/domain';
import { cyan, green } from '@/utils';

enum SuccessMessageType {
  OPTIMIZE = 'optimize',
  SCHEMAS = 'schemas',
}

/**
 * Command 'contracts build'
 * Builds the smart contracts optimized Wasm file along with its schemas
 */
export default class ContractsBuild extends BaseCommand<typeof ContractsBuild> {
  static summary = 'Builds the smart contracts optimized Wasm file along with its schemas';
  static args = {
    contract: ContractNameRequiredArg,
  };

  static examples = [
    {
      description: 'Build the optimized version of a contract, and generate the updated schemas',
      command: '<%= config.bin %> <%= command.id %> my-contract',
    },
  ];

  /**
   * Runs the command.
   *
   * @returns Empty promise
   */
  public async run(): Promise<void> {
    const config = await Config.init();

    await config.assertIsValidWorkspace();
    this.log(`Building ${green('Optimized')} wasm file for ${this.args.contract} using Docker...`);
    const resultPath = await config.contractsInstance.optimize(this.args.contract!);
    await this.successMessage(SuccessMessageType.OPTIMIZE, resultPath);

    await config.contractsInstance.schemas(this.args.contract!);
    await this.successMessage(SuccessMessageType.SCHEMAS);
  }

  protected async successMessage(type: SuccessMessageType, outputPath?: string): Promise<void> {
    switch (type) {
      case SuccessMessageType.OPTIMIZE:
        this.success(`Optimized Wasm binary saved to ${cyan(outputPath)}}}`);

        break;
      case SuccessMessageType.SCHEMAS:
        this.success('Schemas generated');

        break;
    }
  }
}
