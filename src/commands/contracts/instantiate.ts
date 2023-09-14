import { InstantiateResult } from '@cosmjs/cosmwasm-stargate';
import { Args, Flags } from '@oclif/core';
import fs from 'node:fs/promises';

import { Accounts, Config } from '@/domain';
import { InstantiateError, NotFoundError, OnlyOneArgSourceError } from '@/exceptions';
import { BaseCommand } from '@/lib/base';
import { ParamsContractNameOptionalArg, StdinInputArg } from '@/parameters/arguments';
import { KeyringFlags, ParamsAmountOptionalFlag, TransactionFlags } from '@/parameters/flags';
import { showDisappearingSpinner } from '@/ui';
import { blueBright, buildStdFee, dim, greenBright } from '@/utils';

import { Account, Amount, Contract, DeploymentAction, InstantiateDeployment } from '@/types';

/**
 * Command 'contracts instantiate'
 * Instantiates a code stored on-chain with the given arguments.
 */
export default class ContractsInstantiate extends BaseCommand<typeof ContractsInstantiate> {
  static summary = 'Instantiates code stored on-chain with the given arguments';
  static args = {
    contract: Args.string({ ...ParamsContractNameOptionalArg, ignoreStdin: true }),
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
      description: 'JSON string with a valid instantiate schema for the contract',
    }),
    'args-file': Flags.string({ description: 'Path to a JSON file with a valid instantiate schema for the contract' }),
    ...KeyringFlags,
    ...TransactionFlags,
  };

  static examples = [
    {
      description: 'Instantiate a contract by contract name, with message from --args flag',
      command: '<%= config.bin %> <%= command.id %> my-contract --args \'{"example":{}}\'',
    },
    {
      description: 'Instantiate a contract by code id, with message from --args flag',
      command: '<%= config.bin %> <%= command.id %> --code 10 --args \'{"example":{}}\'',
    },
    {
      description: 'Instantiate a contract, from a specific account',
      command: '<%= config.bin %> <%= command.id %> my-contract --from "alice"',
    },
    {
      description: 'Instantiate a contract, with a custom label',
      command: '<%= config.bin %> <%= command.id %> my-contract --args \'{"example":{}}\' --label "my-contract-v1.0.0"',
    },
    {
      description: 'Instantiate a contract, sending tokens with the transaction',
      command: '<%= config.bin %> <%= command.id %> my-contract --args \'{"example":{}}\' --amount "1const"',
    },
    {
      description: 'Instantiate a contract, with admin account different than the sender',
      command: '<%= config.bin %> <%= command.id %> my-contract --args \'{"example":{}}\' --admin "archway1dstndnaelj95ksruudc2ww4s9epn8m59xft7jz"',
    },
    {
      description: 'Instantiate a contract, with no admin',
      command: '<%= config.bin %> <%= command.id %> my-contract --args \'{"example":{}}\' --no-admin',
    },
    {
      description: 'Instantiate a contract, with message from file',
      command: '<%= config.bin %> <%= command.id %> my-contract --args-file="./instMsg.json"',
    },
    {
      description: 'Instantiate a contract, with query message from stdin',
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
      throw new OnlyOneArgSourceError('Init');
    } else if (!this.flags['args-file'] && !this.args.stdinInput && !this.flags.args) {
      throw new NotFoundError('Init args to instantiate the contract');
    }

    const config = await Config.init();
    const accountsDomain = await Accounts.initFromFlags(this.flags, config);

    const from = await accountsDomain.getWithSigner(this.flags.from, config.defaultAccount);

    const getAdmin = async (): Promise<string> =>
      this.flags.admin ? (await accountsDomain.accountBaseFromAddress(this.flags.admin)).address : from.account.address;
    const admin = this.flags['no-admin'] ? undefined : await getAdmin();

    const instArgs = JSON.parse(this.args.stdinInput || this.flags.args || (await fs.readFile(this.flags['args-file']!, 'utf-8')));

    let label = this.flags.label;

    let contractInstance: Contract | undefined;

    // If code id is not set as flag, try to get it from deployments history
    let codeId = this.flags.code;
    if (!codeId) {
      if (!this.args.contract)
        throw new NotFoundError("Please pass either the Contract name in the arguments, or the '--code' flag.");

      await config.assertIsValidWorkspace();

      contractInstance = config.contractsInstance.getContractByName(this.args.contract);

      codeId = config.contractsInstance.findStoreDeployment(this.args.contract!, config.chainId)?.wasm.codeId;

      if (!codeId) throw new NotFoundError("Code id of contract's store deployment");

      if (!label) label = contractInstance.label;

      // Validate instantiate args schema
      await config.contractsInstance.assertValidInstantiateArgs(contractInstance.name, instArgs);
    }

    if (!label) throw new NotFoundError("Please pass the label of the contract in the '--label' flag.");

    await this.logTransactionDetails(config, codeId, admin!, from.account, label, contractInstance?.name);

    const result = await showDisappearingSpinner(async () => {
      try {
        const signingClient = await config.getSigningArchwayClient(from, this.flags['gas-adjustment']);

        return signingClient.instantiate(from.account.address, codeId!, instArgs, label!, buildStdFee(this.flags.fee?.coin), {
          funds: this.flags.amount?.coin ? [this.flags.amount.coin] : undefined,
          admin,
        });
      } catch (error: Error | any) {
        throw new InstantiateError(error?.message);
      }
    }, 'Waiting for tx to confirm...');

    if (contractInstance) {
      await config.deploymentsInstance.addDeployment(
        {
          action: DeploymentAction.INSTANTIATE,
          txhash: result!.transactionHash,
          wasm: {
            codeId,
          },
          contract: {
            name: contractInstance.name,
            version: contractInstance.version,
            address: result!.contractAddress,
            admin: admin,
          },
          msg: instArgs,
        } as InstantiateDeployment,
        config.chainId
      );
    }

    await this.successMessage(result!, label, config);
  }

  // eslint-disable-next-line max-params
  protected async logTransactionDetails(
    config: Config,
    codeId: number,
    admin: string,
    fromAccount: Account,
    label?: string,
    contractName?: string
  ): Promise<void> {
    this.log(`Instantiating contract ${blueBright(contractName)}`);
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
