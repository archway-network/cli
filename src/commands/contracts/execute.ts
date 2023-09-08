import { Args, Flags } from '@oclif/core';
import fs from 'node:fs/promises';
import { ExecuteResult } from '@cosmjs/cosmwasm-stargate';

import { BaseCommand } from '@/lib/base';
import { ParamsContractNameRequiredArg, StdinInputArg } from '@/parameters/arguments';
import { Accounts, Config } from '@/domain';
import { buildStdFee, blueBright, greenBright, isValidAddress } from '@/utils';
import { showDisappearingSpinner } from '@/ui';
import { KeyringFlags, TransactionFlags, ParamsAmountOptionalFlag } from '@/parameters/flags';
import { ExecuteError, NotFoundError, OnlyOneArgSourceError } from '@/exceptions';

import { Account, Amount, Contract } from '@/types';

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

    const config = await Config.init();
    const accountsDomain = await Accounts.initFromFlags(this.flags, config);

    const from = await accountsDomain.getWithSigner(this.flags.from, config.defaultAccount);

    const executeArgs = JSON.parse(this.args.stdinInput || this.flags.args || (await fs.readFile(this.flags['args-file']!, 'utf-8')));

    // Load contract info
    let contractAddress: string;
    let contractInstance: Contract | undefined;

    if (isValidAddress(this.args.contract!)) {
      contractAddress = this.args.contract!;
    } else {
      await config.assertIsValidWorkspace();

      contractInstance = config.contractsInstance.getContractByName(this.args.contract!);
      const instantiated = config.contractsInstance.findInstantiateDeployment(contractInstance.name, config.chainId);

      if (!instantiated) throw new NotFoundError('Instantiated deployment with a contract address');

      contractAddress = instantiated.contract.address;

      // Validate exec args schema
      await config.contractsInstance.assertValidExecuteArgs(contractInstance.name, executeArgs);
    }

    await this.logTransactionDetails(config, contractInstance?.name || contractAddress, from.account);

    const result = await showDisappearingSpinner(async () => {
      try {
        const signingClient = await config.getSigningArchwayClient(from, this.flags['gas-adjustment']);

        return signingClient.execute(
          from.account.address,
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

    await this.successMessage(result!, contractInstance?.label || contractAddress, config);
  }

  protected async logTransactionDetails(config: Config, contractName: string, fromAccount: Account): Promise<void> {
    this.log(`Executing contract ${blueBright(contractName)}`);
    this.log(`  Chain: ${blueBright(config.chainId)}`);
    this.log(`  Signer: ${blueBright(fromAccount.name)}\n`);
  }

  protected async successMessage(result: ExecuteResult, contractLabel: string, configInstance: Config): Promise<void> {
    if (this.jsonEnabled()) {
      this.logJson(result);
    } else {
      this.success(`${greenBright('Executed contract ')} ${blueBright(contractLabel)}`);
      this.log(`  Transaction: ${await configInstance.prettyPrintTxHash(result.transactionHash)}`);
    }
  }
}
