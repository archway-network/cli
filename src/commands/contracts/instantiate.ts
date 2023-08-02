import { Args, Flags } from '@oclif/core';
import fs from 'node:fs/promises';
import path from 'node:path';
import { InstantiateResult } from '@cosmjs/cosmwasm-stargate';

import { BaseCommand } from '@/lib/base';
import { definitionContractNameRequired } from '@/arguments/contract';
import { Config } from '@/domain/Config';
import { blue, green, red } from '@/utils/style';
import { buildStdFee } from '@/utils/coin';
import { showSpinner } from '@/ui/Spinner';
import { TransactionFlags } from '@/flags/transaction';
import { Accounts } from '@/domain/Accounts';
import { KeyringFlags } from '@/flags/keyring';
import { definitionAmountOptional } from '@/flags/amount';
import { stdinInput } from '@/arguments/stdinInput';
import { ConsoleError } from '@/types/ConsoleError';
import { ErrorCodes } from '@/exceptions/ErrorCodes';
import { NotFoundError } from '@/exceptions';

import { AccountWithMnemonic, BackendType } from '@/types/Account';
import { DeploymentAction, InstantiateDeployment } from '@/types/Deployment';
import { Amount } from '@/types/Coin';

/**
 * Command 'contracts instantiate'
 * Instantiates a code stored on-chain with the given arguments.
 */
export default class ContractsInstantiate extends BaseCommand<typeof ContractsInstantiate> {
  static summary = 'Instantiates code stored on-chain with the given arguments';
  static args = {
    contract: Args.string({ ...definitionContractNameRequired, ignoreStdin: true }),
    stdinInput,
  };

  static flags = {
    admin: Flags.string({ description: 'Name of an account OR a valid bech32 address used as the contract admin' }),
    'no-admin': Flags.boolean({ description: 'Instantiates the contract without an admin', default: false }),
    label: Flags.string({ description: 'A human-readable name for this contract, displayed on explorers' }),
    code: Flags.integer({ description: 'Code stored' }),
    amount: Flags.custom<Amount | undefined>({
      ...definitionAmountOptional,
      description: 'Funds to send to the contract during instantiation',
    })(),
    args: Flags.string({
      required: true,
      description: 'JSON string with a valid instantiate schema for the contract',
    }),
    'args-file': Flags.string({ description: 'Path to a JSON file with a valid instantiate schema for the contract' }),
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
      throw new OnlyOneInitArgsError();
    } else if (!this.flags['args-file'] && !this.args.stdinInput && !this.flags.args) {
      throw new NotFoundError('Init args to instantiate the contract');
    }

    // Load config and contract info
    const config = await Config.open();
    await config.contractsInstance.assertValidWorkspace();
    const contract = config.contractsInstance.assertGetContractByName(this.args.contract!);
    const accountsDomain = await Accounts.init(this.flags['keyring-backend'] as BackendType, { filesPath: this.flags['keyring-path'] });
    const fromAccount: AccountWithMnemonic = await accountsDomain.getWithMnemonic(this.flags.from!);

    const label = this.flags.label || contract.label;
    const admin = this.flags['no-admin'] ?
      undefined :
      (this.flags.admin ?
        (await accountsDomain.accountBaseFromAddress(this.flags.admin)).address :
        fromAccount.address);

    // If code id is not set as flag, try to get it from deployments history
    let codeId = this.flags.code;
    if (!codeId) {
      codeId = await config.contractsInstance.findCodeId(this.args.contract!, config.chainId);

      if (!codeId) throw new NotFoundError("Code id of contract's store deployment");
    }

    // Log message that we are starting the instantiation
    this.log(`Instantiating contract ${blue(contract.name)}`);
    this.log(`  Chain: ${blue(config.chainId)}`);
    this.log(`  Code: ${blue(codeId)}`);
    this.log(`  Label: ${blue(label)}`);
    this.log(`  Admin: ${blue(admin)}`);
    this.log(`  Signer: ${blue(fromAccount.name)}\n`);

    // Validate init args schema
    const initArgs = JSON.parse(this.flags.args || this.args.stdinInput || (await fs.readFile(this.flags['args-file']!, 'utf-8')));
    await config.contractsInstance.validateInstantiateSchema(contract.name, initArgs);

    let result: InstantiateResult;

    await showSpinner(async () => {
      try {
        const signingClient = await config.getSigningArchwayClient(fromAccount);

        result = await signingClient.instantiate(fromAccount.address, codeId!, initArgs, label, buildStdFee(this.flags.fee?.coin), {
          funds: this.flags.amount?.coin ? [this.flags.amount.coin] : undefined,
          admin,
        });
      } catch (error: Error | any) {
        throw new InstantiateError(error?.message);
      }
    }, 'Waiting for tx to confirm...');

    await config.deploymentsInstance.addDeployment(
      {
        action: DeploymentAction.INSTANTIATE,
        txhash: result!.transactionHash,
        contract: {
          name: contract.name,
          version: contract.version,
          address: result!.contractAddress,
          admin: admin,
        },
        wasm: {
          codeId,
        },
        msg: initArgs,
      } as InstantiateDeployment,
      config.chainId
    );

    if (this.jsonEnabled()) {
      this.logJson(result!);
    }

    this.success(`${green('Contract')} ${blue(path.basename(label))} ${green('instantiated')}`);
    this.log(`  Address: ${blue(result!.contractAddress)}`);
    this.log(`  Transaction: ${await config.prettyPrintTxHash(result!.transactionHash)}`);
  }
}

/**
 * Error when user tries to input init args from many sources
 */
export class OnlyOneInitArgsError extends ConsoleError {
  constructor() {
    super(ErrorCodes.ONLY_ONE_INIT_ARGS);
  }

  /**
   * {@inheritDoc ConsoleError.toConsoleString}
   */
  toConsoleString(): string {
    return `${red('Please specify only one init args input')}`;
  }
}

/**
 * Error when instantiate contract fails
 */
export class InstantiateError extends ConsoleError {
  constructor(public description: string) {
    super(ErrorCodes.INSTANTIATE_FAILED);
  }

  /**
   * {@inheritDoc ConsoleError.toConsoleString}
   */
  toConsoleString(): string {
    return red(`Failed to instantiate contract: ${this.description}`);
  }
}
