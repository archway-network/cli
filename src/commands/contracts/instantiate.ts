import { InstantiateResult } from '@cosmjs/cosmwasm-stargate';
import { Args, Flags } from '@oclif/core';
import fs from 'node:fs/promises';

import { Accounts, Config } from '@/domain';
import { InstantiateError, NotFoundError, OnlyOneArgSourceError } from '@/exceptions';
import { BaseCommand } from '@/lib/base';
import { ParamsContractNameRequiredArg, StdinInputArg } from '@/parameters/arguments';
import { KeyringFlags, ParamsAmountOptionalFlag, TransactionFlags } from '@/parameters/flags';
import { showDisappearingSpinner } from '@/ui';
import { blueBright, buildStdFee, greenBright } from '@/utils';

import { Account, Amount, BackendType, Contract, DeploymentAction, InstantiateDeployment } from '@/types';

/**
 * Command 'contracts instantiate'
 * Instantiates a code stored on-chain with the given arguments.
 */
export default class ContractsInstantiate extends BaseCommand<typeof ContractsInstantiate> {
  static summary = 'Instantiates code stored on-chain with the given arguments';
  static args = {
    contract: Args.string({ ...ParamsContractNameRequiredArg, ignoreStdin: true }),
    stdinInput: StdinInputArg,
  };

  static flags = {
    admin: Flags.string({ description: 'Name of an account OR a valid bech32 address used as the contract admin' }),
    'no-admin': Flags.boolean({ description: 'Instantiates the contract without an admin', default: false }),
    label: Flags.string({ description: 'A human-readable name for this contract, displayed on explorers' }),
    code: Flags.integer({ description: 'Code stored' }),
    amount: Flags.custom<Amount | undefined>({
      ...ParamsAmountOptionalFlag,
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
      throw new OnlyOneArgSourceError('Init');
    } else if (!this.flags['args-file'] && !this.args.stdinInput && !this.flags.args) {
      throw new NotFoundError('Init args to instantiate the contract');
    }

    // Load config and contract info
    const config = await Config.init();
    await config.assertIsValidWorkspace();
    const contract = config.contractsInstance.getContractByName(this.args.contract!);
    const accountsDomain = await Accounts.init(this.flags['keyring-backend'] as BackendType, { filesPath: this.flags['keyring-path'] });
    const from = await accountsDomain.getWithSigner(this.flags.from!);

    const label = this.flags.label || contract.label;
    const getAdmin = async (): Promise<string> =>
      this.flags.admin ? (await accountsDomain.accountBaseFromAddress(this.flags.admin)).address : from.account.address;
    const admin = this.flags['no-admin'] ? undefined : await getAdmin();

    // If code id is not set as flag, try to get it from deployments history
    let codeId = this.flags.code;
    if (!codeId) {
      codeId = config.contractsInstance.findStoreDeployment(this.args.contract!, config.chainId)?.wasm.codeId;

      if (!codeId) throw new NotFoundError("Code id of contract's store deployment");
    }

    await this.logTransactionDetails(config, contract, codeId, label, admin!, from.account);

    // Validate init args schema
    const initArgs = JSON.parse(this.args.stdinInput || this.flags.args || (await fs.readFile(this.flags['args-file']!, 'utf-8')));
    await config.contractsInstance.assertValidInstantiateArgs(contract.name, initArgs);

    const result = await showDisappearingSpinner(async () => {
      try {
        const signingClient = await config.getSigningArchwayClient(from, this.flags['gas-adjustment']);

        return signingClient.instantiate(from.account.address, codeId!, initArgs, label, buildStdFee(this.flags.fee?.coin), {
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
        wasm: {
          codeId,
        },
        contract: {
          name: contract.name,
          version: contract.version,
          address: result!.contractAddress,
          admin: admin,
        },
        msg: initArgs,
      } as InstantiateDeployment,
      config.chainId
    );

    await this.successMessage(result!, label, config);
  }

  // eslint-disable-next-line max-params
  protected async logTransactionDetails(
    config: Config,
    contract: Contract,
    codeId: number,
    label: string,
    admin: string,
    fromAccount: Account
  ): Promise<void> {
    this.log(`Instantiating contract ${blueBright(contract.name)}`);
    this.log(`  Chain: ${blueBright(config.chainId)}`);
    this.log(`  Code: ${blueBright(codeId)}`);
    this.log(`  Label: ${blueBright(label)}`);
    this.log(`  Admin: ${blueBright(admin)}`);
    this.log(`  Signer: ${blueBright(fromAccount.name)}\n`);
  }

  protected async successMessage(result: InstantiateResult, label: string, configInstance: Config): Promise<void> {
    if (this.jsonEnabled()) {
      this.logJson(result);
    } else {
      this.success(`${greenBright('Contract')} ${blueBright(label)} ${greenBright('instantiated')}`);
      this.log(`  Address: ${blueBright(result.contractAddress)}`);
      this.log(`  Transaction: ${await configInstance.prettyPrintTxHash(result.transactionHash)}`);
    }
  }
}
