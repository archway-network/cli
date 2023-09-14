import { Args, Flags } from '@oclif/core';
import { JsonObject } from '@cosmjs/cosmwasm-stargate';
import fs from 'node:fs/promises';

import { BaseCommand } from '@/lib/base';
import { ParamsContractNameRequiredArg, StdinInputArg } from '@/parameters/arguments';
import { Config } from '@/domain';
import { showDisappearingSpinner } from '@/ui';
import { NotFoundError, OnlyOneArgSourceError } from '@/exceptions';
import { dim } from '@/utils';
import { SkipValidationFlag } from '@/parameters/flags';

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
    'skip-validation': SkipValidationFlag,
  };

  static examples = [
    {
      description: 'Query a smart contract by contract name in the project, with query message in the --args flag',
      command: '<%= config.bin %> <%= command.id %> my-contract --args \'{"example":{}}\'',
    },
    {
      description: 'Query a smart contract by address, with query message in the --args flag',
      command: '<%= config.bin %> <%= command.id %> archway13lq4qvmydry3p394jrrfuv2z5xemzdnsplqdrm --args \'{"example":{}}\'',
    },
    {
      description: 'Query a smart contract, with query message from file',
      command: '<%= config.bin %> <%= command.id %> my-contract --args-file "./queryMsg.json"',
    },
    {
      description: 'Query a smart contract, with query message from stdin',
      command: dim('$ echo \'{"example":{}}\' | <%= config.bin %> <%= command.id %> my-contract'),
    },
  ];

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

    const queryMsg = JSON.parse(this.args.stdinInput || this.flags.args ||  (await fs.readFile(this.flags['args-file']!, 'utf-8')));

    if (!this.flags['skip-validation']) {
      await config.contractsInstance.assertValidQueryArgs(contract.name, queryMsg);
    }

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
