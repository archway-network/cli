import { Args, Flags } from '@oclif/core';
import fs from 'node:fs/promises';
import { ExecuteResult } from '@cosmjs/cosmwasm-stargate';

import { BaseCommand } from '@/lib/base';
import { ParamsContractNameRequiredArg, StdinInputArg } from '@/parameters/arguments';
import { Accounts, Config } from '@/domain';
import { buildStdFee, blueBright, greenBright, isValidAddress, dim } from '@/utils';
import { showDisappearingSpinner } from '@/ui';
import { KeyringFlags, TransactionFlags, ParamsAmountOptionalFlag, SkipValidationFlag } from '@/parameters/flags';
import { ExecuteError, NotFoundError, OnlyOneArgSourceError } from '@/exceptions';

import { Account, Amount, Contract } from '@/types';

/**
 * Command 'contracts execute'
 * Executes a transaction in a smart contract.
 */
export default class ContractsExecute extends BaseCommand<typeof ContractsExecute> {
  static summary = 'Executes a transaction in a smart contract';
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
    'skip-validation': SkipValidationFlag,
    ...KeyringFlags,
    ...TransactionFlags,
  };

  static examples = [
    {
      description: 'Execute a transaction in a contract by contract name, with message from --args flag',
      command: '<%= config.bin %> <%= command.id %> my-contract --args \'{"example":{}}\'',
    },
    {
      description: 'Execute a transaction in a contract by address, with message from --args flag',
      command: '<%= config.bin %> <%= command.id %> archway13lq4qvmydry3p394jrrfuv2z5xemzdnsplqdrm --args \'{"example":{}}\'',
    },
    {
      description: 'Execute a transaction in a contract, from a specific account',
      command: '<%= config.bin %> <%= command.id %> my-contract --args \'{"example":{}}\' --from "alice"',
    },
    {
      description: 'Execute a transaction in a contract by contract name, sending tokens with the transaction',
      command: '<%= config.bin %> <%= command.id %> my-contract --args \'{"example":{}}\' --amount "1const"',
    },
    {
      description: 'Execute a transaction in a contract, with message from file',
      command: '<%= config.bin %> <%= command.id %> my-contract --args-file="./execMsg.json"',
    },
    {
      description: 'Execute a transaction in a contract, with query message from stdin',
      command: dim('$ echo \'{"example":{}}\' | <%= config.bin %> <%= command.id %> my-contract'),
    },
  ];

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

      if (!this.flags['skip-validation']) {
        await config.contractsInstance.assertValidExecuteArgs(contractInstance.name, executeArgs);
      }
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
