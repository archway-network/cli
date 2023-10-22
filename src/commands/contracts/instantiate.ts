
import { InstantiateResult } from '@cosmjs/cosmwasm-stargate';
import { Args, Flags } from '@oclif/core';

import { Accounts, Config } from '@/domain';
import { InstantiateError, NotFoundError } from '@/exceptions';
import { BaseCommand } from '@/lib/base';
import { ParamsContractNameOptionalArg } from '@/parameters/arguments';
import { ContractMsgArg, ContractMsgFlags, CustomFlags, KeyringFlags, NoValidationFlag, TransactionFlags, parseContractMsgArgs } from '@/parameters/flags';
import { ArchwayClientBuilder } from '@/services';
import { AccountWithSigner, Contract, DeploymentAction, InstantiateDeployment, JsonObject } from '@/types';
import { showDisappearingSpinner } from '@/ui';
import { blueBright, buildStdFee, dim, getErrorMessage, greenBright } from '@/utils';

/**
 * Command 'contracts instantiate'
 * Instantiates a code stored on-chain with the given arguments.
 */
export default class ContractsInstantiate extends BaseCommand<typeof ContractsInstantiate> {
  static summary = 'Instantiates code stored on-chain with the given arguments';
  static args = {
    contract: Args.string({ ...ParamsContractNameOptionalArg, ignoreStdin: true }),
    ...ContractMsgArg,
  };

  static flags = {
    admin: Flags.string({ description: 'Name of an account OR a valid bech32 address used as the contract admin' }),
    'no-admin': Flags.boolean({ description: 'Instantiates the contract without an admin', default: false }),
    label: Flags.string({ description: 'A human-readable name for this contract, displayed on explorers' }),
    code: Flags.integer({ description: 'Code stored' }),
    amount: CustomFlags.amount({
      description: 'Funds to send to the contract during instantiation',
    }),
    'no-validation': NoValidationFlag,
    ...ContractMsgFlags,
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
   * @returns Promise containing an {@link InstantiateResult}
   */
  public async run(): Promise<InstantiateResult> {
    const config = await Config.init();
    const accountsDomain = Accounts.initFromFlags(this.flags, config);

    const from = await accountsDomain.getWithSigner(this.flags.from, config.defaultAccount);

    const { contractInstance, codeId, label } = await this.getContractInfo(config);
    const instantiateMsg = await parseContractMsgArgs(this.args, this.flags);

    if (!this.flags['no-validation'] && instantiateMsg && contractInstance) {
      await config.contractsInstance.assertValidInstantiateArgs(contractInstance.name, instantiateMsg);
    }

    const admin = this.flags['no-admin'] ? undefined : this.getAdmin(accountsDomain, from);

    this.log(`Instantiating contract ${blueBright(contractInstance?.name)}`);
    this.log(`  Chain: ${blueBright(config.chainId)}`);
    this.log(`  Code: ${blueBright(codeId)}`);
    this.log(`  Label: ${blueBright(label)}`);
    this.log(`  Admin: ${blueBright(admin)}`);
    this.log(`  Signer: ${blueBright(from.account.name)}\n`);

    const result = await showDisappearingSpinner(
      async () => this.instantiate(config, from, codeId, instantiateMsg, label, admin),
      'Waiting for tx to confirm...'
    );

    await this.addDeployment(config, result, codeId, instantiateMsg, contractInstance, admin);

    this.success(`${greenBright('Contract')} ${blueBright(label)} ${greenBright('instantiated')}`);
    this.log(`  Address: ${blueBright(result.contractAddress)}`);
    this.log(`  Transaction: ${config.prettyPrintTxHash(result.transactionHash)}`);

    return result;
  }

  // eslint-disable-next-line max-params
  private async addDeployment(
    config: Config,
    result: InstantiateResult,
    codeId: number,
    instantiateMsg: JsonObject,
    contractInstance?: Contract,
    admin?: string
  ): Promise<void> {
    if (!contractInstance) {
      return;
    }

    await config.deploymentsInstance.addDeployment(
      {
        action: DeploymentAction.INSTANTIATE,
        txhash: result.transactionHash,
        wasm: {
          codeId,
        },
        contract: {
          name: contractInstance.name,
          version: contractInstance.version,
          address: result.contractAddress,
          admin,
        },

        msg: instantiateMsg,
      } as InstantiateDeployment,
      config.chainId
    );
  }

  // eslint-disable-next-line max-params
  private async instantiate(
    config: Config,
    from: AccountWithSigner,
    codeId: number,
    msg: JsonObject,
    label: string,
    admin?: string
  ): Promise<InstantiateResult> {
    try {
      const signingClient = await ArchwayClientBuilder.getSigningArchwayClient(config, from, this.flags['gas-adjustment']);

      const funds = this.flags.amount?.coin ? [this.flags.amount.coin] : undefined;

      return signingClient.instantiate(
        from.account.address,
        codeId,
        msg,
        label,
        buildStdFee(this.flags.fee?.coin),
        {
          funds,
          admin,
        }
      );
    } catch (error) {
      throw new InstantiateError(getErrorMessage(error));
    }
  }

  private async getContractInfo(config: Config): Promise<{
    codeId: number;
    contractInstance?: Contract;
    label: string;
  }> {
    if (!this.flags.code && !this.args.contract) {
      throw new NotFoundError("Pass either the Contract name in the arguments, or the '--code' flag.");
    }

    if (this.args.contract) {
      await config.assertIsValidWorkspace();
    }

    const codeId = this.getCodeId(config);
    const contractInstance = this.args.contract ? config.contractsInstance.getContractByName(this.args.contract) : undefined;

    const label = this.flags.label || contractInstance?.label as string;
    if (!label) {
      throw new NotFoundError("Pass the label of the contract in the '--label' flag.");
    }

    return { codeId, contractInstance, label };
  }

  private getCodeId(config: Config): number {
    const codeId = this.flags.code || config.contractsInstance.findStoreDeployment(this.args.contract!, config.chainId)?.wasm.codeId;
    if (!codeId) {
      throw new NotFoundError("Code id of contract's store deployment");
    }

    return codeId;
  }

  private getAdmin(accountsDomain: Accounts, from: AccountWithSigner): string {
    const { address } = this.flags.admin
      ? accountsDomain.accountBaseFromAddress(this.flags.admin)
      : from.account;
    return address;
  }
}
