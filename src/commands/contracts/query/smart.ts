import { Args, Flags } from '@oclif/core';
import { JsonObject } from '@cosmjs/cosmwasm-stargate';
import fs from 'node:fs/promises';

import { BaseCommand } from '@/lib/base';
import { ParamsContractNameRequiredArg, StdinInputArg } from '@/parameters/arguments';
import { Config } from '@/domain';
import { showDisappearingSpinner } from '@/ui';
import { NotFoundError, OnlyOneArgSourceError } from '@/exceptions';

/**
 * Command 'contracts query smart'
 * Queries a single smart contract
 */
export default class ContractsQuerySmart extends BaseCommand<typeof ContractsQuerySmart> {
  static summary = 'Queries a single smart contract';
  static args = {
    contract: Args.string({ ...ParamsContractNameRequiredArg, ignoreStdin: true }),
    stdinInput: StdinInputArg,
  };

  static flags = {
    args: Flags.string({
      description: 'JSON string with the query to run',
    }),
    'args-file': Flags.string({ description: 'Path to a JSON file with a query for the smart contract' }),
  };

  /**
   * Runs the command.
   *
   * @returns Empty promise
   */
  public async run(): Promise<void> {
    // Validate that we only get migration message args from one source of all 3 possible inputs
    if (
      (this.flags['args-file'] && this.args.stdinInput) ||
      (this.flags['args-file'] && this.flags.args) ||
      (this.flags.args && this.args.stdinInput)
    ) {
      throw new OnlyOneArgSourceError('Migration message');
    } else if (!this.flags['args-file'] && !this.args.stdinInput && !this.flags.args) {
      throw new NotFoundError('Query args');
    }

    // Load config and contract info
    const config = await Config.init();
    await config.assertIsValidWorkspace();
    const contract = config.contractsInstance.getContractByName(this.args.contract!);

    const instantiated = config.contractsInstance.findInstantiateDeployment(this.args.contract!, config.chainId);

    if (!instantiated) throw new NotFoundError('Instantiated deployment with a contract address');

    const contractAddress = instantiated.contract.address;

    // Validate query arguments
    const queryMsg = JSON.parse(this.flags.args || this.args.stdinInput || (await fs.readFile(this.flags['args-file']!, 'utf-8')));
    await config.contractsInstance.assertValidQueryArgs(contract.name, queryMsg);

    const result = await showDisappearingSpinner(async () => {
      const client = await config.getArchwayClient();

      return client.queryContractSmart(contractAddress, queryMsg);
    }, 'Waiting for query response...');

    await this.successMessage(result);
  }

  protected async successMessage(result: JsonObject): Promise<void> {
    this.logJson(result);
  }
}
