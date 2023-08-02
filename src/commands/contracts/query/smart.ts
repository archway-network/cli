import { Args, Flags } from '@oclif/core';
import { JsonObject } from '@cosmjs/cosmwasm-stargate';
import fs from 'node:fs/promises';

import { BaseCommand } from '@/lib/base';
import { ParamsContractNameRequiredArg, StdinInputArg } from '@/arguments';
import { Accounts, Config } from '@/domain';
import { showSpinner } from '@/ui';
import { KeyringFlags, TransactionFlags } from '@/flags';
import { NotFoundError, OnlyOneArgSourceError } from '@/exceptions';

import { AccountWithMnemonic, BackendType } from '@/types';
import { SuccessMessages } from '@/services';

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
    ...KeyringFlags,
    ...TransactionFlags,
    args: Flags.string({
      description: 'JSON string with a message to be passed to the contract on migration',
    }),
    'args-file': Flags.string({ description: 'Path to a JSON file with a message to be passed to the contract on migration' }),
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
    await config.contractsInstance.assertValidWorkspace();
    const contract = config.contractsInstance.assertGetContractByName(this.args.contract!);
    const accountsDomain = await Accounts.init(this.flags['keyring-backend'] as BackendType, { filesPath: this.flags['keyring-path'] });
    const fromAccount: AccountWithMnemonic = await accountsDomain.getWithMnemonic(this.flags.from!);

    const instantiated = config.contractsInstance.findInstantiateDeployment(this.args.contract!, config.chainId);

    if (!instantiated) throw new NotFoundError('Instantiated deployment with a contract address');

    const contractAddress = instantiated.contract.address;

    // Validate query arguments
    const queryMsg = JSON.parse(this.flags.args || this.args.stdinInput || (await fs.readFile(this.flags['args-file']!, 'utf-8')));
    await config.contractsInstance.assertValidQueryArgs(contract.name, queryMsg);

    let result: JsonObject;

    await showSpinner(async () => {
      const signingClient = await config.getSigningArchwayClient(fromAccount);

      result = await signingClient.queryContractSmart(contractAddress, queryMsg);
    }, 'Waiting for query response...');

    SuccessMessages.contracts.query.smart(this, result);
  }
}
