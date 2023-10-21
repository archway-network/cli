
import { ExecuteResult } from '@cosmjs/cosmwasm-stargate';
import { Args, Flags } from '@oclif/core';

import { Accounts, Config } from '@/domain';
import { ExecuteError, NotFoundError } from '@/exceptions';
import { BaseCommand } from '@/lib/base';
import { ParamsContractNameRequiredArg } from '@/parameters/arguments';
import { ContractMsgArg, ContractMsgFlags, KeyringFlags, NoValidationFlag, ParamsAmountOptionalFlag, TransactionFlags, parseContractMsgArgs } from '@/parameters/flags';
import { ArchwayClientBuilder } from '@/services';
import { AccountWithSigner, Amount, Contract, JsonObject } from '@/types';
import { showDisappearingSpinner } from '@/ui';
import { blueBright, buildStdFee, dim, getErrorMessage, greenBright, isValidAddress } from '@/utils';

/**
 * Command 'contracts execute'
 * Executes a transaction in a smart contract.
 */
export default class ContractsExecute extends BaseCommand<typeof ContractsExecute> {
  static summary = 'Executes a transaction in a smart contract';
  static args = {
    contract: Args.string({ ...ParamsContractNameRequiredArg, ignoreStdin: true }),
    ...ContractMsgArg,
  };

  static flags = {
    amount: Flags.custom<Amount | undefined>({
      ...ParamsAmountOptionalFlag,
      description: 'Funds to send to the contract on the transaction',
    })(),
    'no-validation': NoValidationFlag,
    ...ContractMsgFlags,
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
   * @returns Promise containing an {@link ExecuteResult}
   */
  public async run(): Promise<ExecuteResult> {
    const config = await Config.init();
    const accountsDomain = Accounts.initFromFlags(this.flags, config);

    const from = await accountsDomain.getWithSigner(this.flags.from, config.defaultAccount);

    const { contractAddress, contractInstance } = await this.getContractInfo(config);
    const executeMsg = await parseContractMsgArgs(this.args, this.flags);

    if (!this.flags['no-validation'] && executeMsg && contractInstance) {
      await config.contractsInstance.assertValidExecuteArgs(contractInstance.name, executeMsg);
    }

    const contractName = contractInstance?.name || contractAddress;
    this.log(`Executing contract ${blueBright(contractName)}`);
    this.log(`  Chain: ${blueBright(config.chainId)}`);
    this.log(`  Signer: ${blueBright(from.account.name)}\n`);

    const result = await showDisappearingSpinner(
      async () => this.execute(config, from, contractAddress, executeMsg)
      , 'Waiting for tx to confirm...'
    );

    this.success(`${greenBright('Executed contract ')} ${blueBright(contractInstance?.label || contractAddress)}`);
    this.log(`  Transaction: ${config.prettyPrintTxHash(result.transactionHash)}`);

    return result;
  }

  private async getContractInfo(config: Config): Promise<{
    contractAddress: string;
    contractInstance?: Contract;
  }> {
    if (isValidAddress(this.args.contract!)) {
      const contractAddress = this.args.contract!;
      return { contractAddress };
    }

    await config.assertIsValidWorkspace();

    const contractInstance = config.contractsInstance.getContractByName(this.args.contract!);
    const instantiateDeployment = config.contractsInstance.findInstantiateDeployment(contractInstance.name, config.chainId);

    if (!instantiateDeployment) {
      throw new NotFoundError('Instantiated deployment with a contract address');
    }

    const contractAddress = instantiateDeployment.contract.address;

    return { contractAddress, contractInstance };
  }

  private async execute(
    config: Config,
    from: AccountWithSigner,
    contractAddress: string,
    executeMsg: JsonObject
  ): Promise<ExecuteResult> {
    try {
      const signingClient = await ArchwayClientBuilder.getSigningArchwayClient(config, from, this.flags['gas-adjustment']);

      return signingClient.execute(
        from.account.address,
        contractAddress,
        executeMsg,
        buildStdFee(this.flags.fee?.coin),
        undefined,
        this.flags.amount?.coin ? [this.flags.amount.coin] : undefined
      );
    } catch (error) {
      throw new ExecuteError(getErrorMessage(error));
    }
  }
}
