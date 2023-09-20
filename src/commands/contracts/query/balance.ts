import { Flags } from '@oclif/core';

import { Config, Contracts } from '@/domain';
import { NotFoundError } from '@/exceptions';
import { BaseCommand } from '@/lib/base';
import { ContractNameOptionalArg } from '@/parameters/arguments';
import { AccountBalancesJSON, InstantiateDeployment } from '@/types';
import { showDisappearingSpinner } from '@/ui';

/**
 * Command 'contracts query balance'
 * Access the bank module to query the balance of smart contracts
 */
export default class ContractsQuerySmart extends BaseCommand<typeof ContractsQuerySmart> {
  static summary = 'Access the bank module to query the balance of smart contracts';
  static args = {
    contract: ContractNameOptionalArg,
  };

  static flags = {
    all: Flags.boolean({
      description: 'Shows the balance of all contracts',
      default: false,
    }),
  };

  static examples = [
    {
      description: 'Query the balance of a contract',
      command: '<%= config.bin %> <%= command.id %> my-contract',
    },
    {
      description: 'Query the balance of all contracts in the project',
      command: '<%= config.bin %> <%= command.id %> --all',
    },
  ];

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
    await config.assertIsValidWorkspace();

    const contractsToQuery = this.getContractsToQuery(config);
    if (contractsToQuery.length === 0) {
      throw new NotFoundError('Instantiated contract with a contract address')
    }

    const result = await showDisappearingSpinner(async () => {
      const client = await config.getStargateClient();

      return config.contractsInstance.queryAllBalances(client, contractsToQuery);
    }, 'Querying contract balances...');

    await this.successMessage(result);
  }

  private getContractsToQuery(config: Config): readonly InstantiateDeployment[] {
    if (this.flags.all) {
      return config.contractsInstance.getAllInstantiateDeployments(config.chainId);
    }

    const instantiated = config.contractsInstance.findInstantiateDeployment(this.args.contract!, config.chainId);

    return instantiated ? [instantiated] : [];
  }

  protected async successMessage(balances: AccountBalancesJSON[]): Promise<void> {
    if (this.jsonEnabled()) {
      this.logJson({ contracts: balances });
    } else {
      for (const item of balances) {
        this.log(`${Contracts.prettyPrintBalances(item)}`);
      }
    }
  }
}
