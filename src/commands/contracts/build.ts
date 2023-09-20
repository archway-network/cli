import { Config } from '@/domain';
import { BaseCommand } from '@/lib/base';
import { ContractNameOptionalArg } from '@/parameters/arguments';
import { cyan } from '@/utils';
import { relative } from 'node:path';

export interface ContractsBuildResult {
  outputPath: string;
}

/**
 * Command 'contracts build'
 * Builds the smart contracts optimized Wasm file along with its schemas
 */
export default class ContractsBuild extends BaseCommand<typeof ContractsBuild> {
  static summary = 'Builds the smart contracts optimized Wasm file along with its schemas';
  static args = {
    contract: ContractNameOptionalArg,
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
  public async run(): Promise<ContractsBuildResult> {
    const config = await Config.init();

    await config.assertIsValidWorkspace();

    this.log(
      this.args.contract ?
        `Building ${cyan('optimized wasm')} file for ${cyan(this.args.contract)} using Docker...` :
        `Building ${cyan('optimized wasm')} file for all contracts in the workspace using Docker...`
    );

    const outputPath = await config.contractsInstance.optimize(this.args.contract, this.jsonEnabled());

    this.log();
    this.success(`Optimized WASM binary saved to ${cyan(relative(config.workspaceRoot, outputPath))}\n`);

    this.log(
      this.args.contract ?
        `Building ${cyan('schemas')} for ${cyan(this.args.contract)}...` :
        `Building ${cyan('schemas')} for all contracts in the workspace...`
    );

    await config.contractsInstance.schemas(this.args.contract, this.jsonEnabled());

    this.log();
    this.success('Schemas generated');

    return { outputPath }
  }
}
