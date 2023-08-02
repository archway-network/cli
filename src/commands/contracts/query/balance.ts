import { Flags } from '@oclif/core';

import { BaseCommand } from '@/lib/base';
import { ContractNameOptionalArg } from '@/arguments';
import { Config } from '@/domain';
import { showSpinner } from '@/ui';
import { NotFoundError } from '@/exceptions';
import { SuccessMessages } from '@/services';

import { InstantiateDeployment } from '@/types';

/**
 * Command 'contracts query balance'
 * Access the bank module to query the balance of contracts
 */
export default class ContractsQuerySmart extends BaseCommand<typeof ContractsQuerySmart> {
  static summary = 'Access the bank module to query the balance of contracts';
  static args = {
    contract: ContractNameOptionalArg,
  };

  static flags = {
    all: Flags.boolean({
      description: 'Shows the balance of all contracts',
      default: false,
    }),
  };

  /**
   * Runs the command.
   *
   * @returns Empty promise
   */
  public async run(): Promise<void> {
    if (!this.args.contract && !this.flags.all) {
      throw new NotFoundError('Contract name or --all flag');
    }

    // Load config and contract info
    const config = await Config.init();
    await config.contractsInstance.assertValidWorkspace();

    let contractsToQuery: InstantiateDeployment[] = [];

    if (this.flags.all) {
      contractsToQuery = config.contractsInstance.getAllInstantiateDeployments(config.chainId);
    } else {
      const instantiated = config.contractsInstance.findInstantiateDeployment(this.args.contract!, config.chainId);

      contractsToQuery = instantiated ? [instantiated] : [];
    }

    if (contractsToQuery.length === 0) throw new NotFoundError('Instantiated contract with a contract address');

    const result = await showSpinner(async () => {
      const client = await config.getStargateClient();

      return config.contractsInstance.queryAllBalances(client, contractsToQuery);
    }, 'Querying contract balances...');

    SuccessMessages.contracts.query.balance(this, result);
  }
}
