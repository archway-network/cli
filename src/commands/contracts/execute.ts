import { Args, Flags } from '@oclif/core';
import fs from 'node:fs/promises';
import { ExecuteResult } from '@cosmjs/cosmwasm-stargate';

import { BaseCommand } from '@/lib/base';
import { definitionContractNameRequired, stdinInput } from '@/arguments';
import { Accounts, Config } from '@/domain';
import { buildStdFee, blue, green } from '@/utils';
import { showSpinner } from '@/ui';
import { KeyringFlags, TransactionFlags, definitionAmountOptional } from '@/flags';
import { ExecuteError, NotFoundError, OnlyOneArgSourceError } from '@/exceptions';

import { AccountWithMnemonic, Amount, BackendType } from '@/types';

/**
 * Command 'contracts execute'
 * Executes a transaction in a contract.
 */
export default class ContractsExecute extends BaseCommand<typeof ContractsExecute> {
  static summary = 'Executes a transaction in a contract';
  static args = {
    contract: Args.string({ ...definitionContractNameRequired, ignoreStdin: true }),
    stdinInput,
  };

  static flags = {
    amount: Flags.custom<Amount | undefined>({
      ...definitionAmountOptional,
      description: 'Funds to send to the contract on the transaction',
    })(),
    args: Flags.string({
      required: true,
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
    const config = await Config.open();
    await config.contractsInstance.assertValidWorkspace();
    const contract = config.contractsInstance.assertGetContractByName(this.args.contract!);
    const accountsDomain = await Accounts.init(this.flags['keyring-backend'] as BackendType, { filesPath: this.flags['keyring-path'] });
    const fromAccount: AccountWithMnemonic = await accountsDomain.getWithMnemonic(this.flags.from!);

    const instantiated = config.contractsInstance.findInstantiateDeployment(this.args.contract!, config.chainId);

    if (!instantiated) throw new NotFoundError('Instantiated deployment with a contract address');

    const contractAddress = instantiated.contract.address;

    // Log message that we are starting the execution
    this.log(`Executing contract ${blue(contract.name)}`);
    this.log(`  Chain: ${blue(config.chainId)}`);
    this.log(`  Signer: ${blue(fromAccount.name)}\n`);

    // Validate init args schema
    const executeArgs = JSON.parse(this.flags.args || this.args.stdinInput || (await fs.readFile(this.flags['args-file']!, 'utf-8')));
    await config.contractsInstance.assertValidExecuteArgs(contract.name, executeArgs);

    let result: ExecuteResult;

    await showSpinner(async () => {
      try {
        const signingClient = await config.getSigningArchwayClient(fromAccount);

        result = await signingClient.execute(
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

    if (this.jsonEnabled()) {
      this.logJson(result!);
    }

    this.success(`${green('Executed contract ')} ${blue(contract.label)}`);
    this.log(`  Transaction: ${await config.prettyPrintTxHash(result!.transactionHash)}`);
  }
}
