import { Args, Flags } from '@oclif/core';
import fs from 'node:fs/promises';
import { ExecuteResult } from '@cosmjs/cosmwasm-stargate';

import { BaseCommand } from '@/lib/base';
import { ParamsContractNameRequiredArg, StdinInputArg } from '@/parameters/arguments';
import { Accounts, Config } from '@/domain';
import { buildStdFee, blue, green } from '@/utils';
import { showDisappearingSpinner } from '@/ui';
import { KeyringFlags, TransactionFlags, ParamsAmountOptionalFlag } from '@/parameters/flags';
import { ExecuteError, NotFoundError, OnlyOneArgSourceError } from '@/exceptions';

import { Account, Amount, BackendType, Contract } from '@/types';

/**
 * Command 'contracts execute'
 * Executes a transaction in a contract.
 */
export default class ContractsExecute extends BaseCommand<typeof ContractsExecute> {
  static summary = 'Executes a transaction in a contract';
  static args = {
    contract: Args.string({ ...ParamsContractNameRequiredArg, ignoreStdin: true }),
    stdinInput: StdinInputArg,
  };

  static flags = {
    amount: Flags.custom<Amount | undefined>({
      ...ParamsAmountOptionalFlag,
      description: 'Funds to send to the contract on the transaction',
    })(),
    args: Flags.string({
      description: 'JSON string with a valid execute schema for the contract',
    }),
    'args-file': Flags.string({ description: 'Path to a JSON file with a valid execute schema for the contract' }),
    ...KeyringFlags,
    ...TransactionFlags,
  };

  /**
   * Runs the command.
   *
   * @returns Empty promise
   */
  public async run(): Promise<void> {
    // Validate that we only get init args from one source of all 3 possible inputs
    if (
      (this.flags['args-file'] && this.args.stdinInput) ||
      (this.flags['args-file'] && this.flags.args) ||
      (this.flags.args && this.args.stdinInput)
    ) {
      throw new OnlyOneArgSourceError('Execute');
    } else if (!this.flags['args-file'] && !this.args.stdinInput && !this.flags.args) {
      throw new NotFoundError('Args to execute in the contract');
    }

    // Load config and contract info
    const config = await Config.init();
    await config.assertIsValidWorkspace();
    const contract = config.contractsInstance.getContractByName(this.args.contract!);
    const accountsDomain = await Accounts.init(this.flags['keyring-backend'] as BackendType, { filesPath: this.flags['keyring-path'] });
    const fromAccount: Account = await accountsDomain.getWithMnemonic(this.flags.from!);

    const instantiated = config.contractsInstance.findInstantiateDeployment(this.args.contract!, config.chainId);

    if (!instantiated) throw new NotFoundError('Instantiated deployment with a contract address');

    const contractAddress = instantiated.contract.address;

    await this.logTransactionDetails(config, contract, fromAccount);

    // Validate init args schema
    const executeArgs = JSON.parse(this.flags.args || this.args.stdinInput || (await fs.readFile(this.flags['args-file']!, 'utf-8')));
    await config.contractsInstance.assertValidExecuteArgs(contract.name, executeArgs);

    const result = await showDisappearingSpinner(async () => {
      try {
        const signingClient = await config.getSigningArchwayClient(fromAccount);

        return signingClient.execute(
          fromAccount.address,
          contractAddress,
          executeArgs,
          buildStdFee(this.flags.fee?.coin),
          undefined,
          this.flags.amount?.coin ? [this.flags.amount.coin] : undefined
        );
      } catch (error: Error | any) {
        throw new ExecuteError(error?.message);
      }
    }, 'Waiting for tx to confirm...');

    await this.successMessage(result!, contract, config);
  }

  protected async logTransactionDetails(config: Config, contract: Contract, fromAccount: Account): Promise<void> {
    this.log(`Executing contract ${blue(contract.name)}`);
    this.log(`  Chain: ${blue(config.chainId)}`);
    this.log(`  Signer: ${blue(fromAccount.name)}\n`);
  }

  protected async successMessage(result: ExecuteResult, contractInstance: Contract, configInstance: Config): Promise<void> {
    if (this.jsonEnabled()) {
      this.logJson(result);
    } else {
      this.success(`${green('Executed contract ')} ${blue(contractInstance.label)}`);
      this.log(`  Transaction: ${await configInstance.prettyPrintTxHash(result.transactionHash)}`);
    }
  }
}
