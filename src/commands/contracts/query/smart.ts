
import { Args } from '@oclif/core';

import { Config } from '@/domain';
import { NotFoundError } from '@/exceptions';
import { BaseCommand } from '@/lib/base';
import { ParamsContractNameRequiredArg } from '@/parameters/arguments';
import { ContractMsgArg, ContractMsgFlags, NoValidationFlag, parseContractMsgArgs } from '@/parameters/flags';
import { ArchwayClientBuilder } from '@/services';
import { JsonObject } from '@/types';
import { showDisappearingSpinner } from '@/ui';
import { dim } from '@/utils';

/**
 * Command 'contracts query smart'
 * Queries a single smart contract
 */
export default class ContractsQuerySmart extends BaseCommand<typeof ContractsQuerySmart> {
  static summary = 'Queries a single smart contract';
  static args = {
    contract: Args.string({ ...ParamsContractNameRequiredArg, ignoreStdin: true }),
    ...ContractMsgArg,
  };

  static flags = {
    'no-validation': NoValidationFlag,
    ...ContractMsgFlags,
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
   * @returns Promise containing a {@link JsonObject}
   */
  public async run(): Promise<JsonObject> {
    // Load config and contract info
    const config = await Config.init();
    await config.assertIsValidWorkspace();

    const contract = config.contractsInstance.getContractByName(this.args.contract!);
    const instantiated = config.contractsInstance.findInstantiateDeployment(this.args.contract!, config.chainId);
    if (!instantiated) {
      throw new NotFoundError('Instantiated deployment with a contract address');
    }

    const contractAddress = instantiated.contract.address;
    const queryMsg = await parseContractMsgArgs(this.args, this.flags);

    if (!this.flags['no-validation']) {
      await config.contractsInstance.assertValidQueryArgs(contract.name, queryMsg);
    }

    const result = await showDisappearingSpinner(async () => {
      const client = await ArchwayClientBuilder.getArchwayClient(config);
      return client.queryContractSmart(contractAddress, queryMsg) as unknown as JsonObject;
    }, 'Waiting for query response...');

    // Ensures that the result is printed to the console independent of the --json flag
    if (!this.jsonEnabled()) {
      this.logJson(result);
    }

    return result;
  }
}
