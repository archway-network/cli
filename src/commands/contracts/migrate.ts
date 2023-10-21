
import { MigrateResult } from '@cosmjs/cosmwasm-stargate';
import { Args, Flags } from '@oclif/core';

import { Accounts, Config } from '@/domain';
import { NotFoundError } from '@/exceptions';
import { BaseCommand } from '@/lib/base';
import { ParamsContractNameRequiredArg } from '@/parameters/arguments';
import { ContractMsgArg, ContractMsgFlags, KeyringFlags, NoValidationFlag, TransactionFlags, parseContractMsgArgs } from '@/parameters/flags';
import { ArchwayClientBuilder } from '@/services';
import { AccountWithSigner, Contract, DeploymentAction, InstantiateDeployment, JsonObject, MigrateDeployment } from '@/types';
import { showDisappearingSpinner } from '@/ui';
import { blueBright, buildStdFee, dim, greenBright, isValidAddress } from '@/utils';

/**
 * Command 'contracts migrate'
 * Runs a smart contract migration
 */
export default class ContractsMigrate extends BaseCommand<typeof ContractsMigrate> {
  static summary = 'Runs a smart contract migration';
  static args = {
    contract: Args.string({ ...ParamsContractNameRequiredArg, ignoreStdin: true }),
    ...ContractMsgArg,
  };

  static flags = {
    code: Flags.integer({ description: 'Code id of the new version that will be migrated to', required: true }),
    'no-validation': NoValidationFlag,
    ...ContractMsgFlags,
    ...KeyringFlags,
    ...TransactionFlags,
  };

  static examples = [
    {
      description: 'Migrate a contract by contract name, with empty migrate message',
      command: '<%= config.bin %> <%= command.id %> my-contract --code 21',
    },
    {
      description: 'Migrate a contract, from a specific account',
      command: '<%= config.bin %> <%= command.id %> my-contract --code 21 --from "alice"',
    },
    {
      description: 'Migrate a contract, with message from --args flag',
      command: '<%= config.bin %> <%= command.id %> my-contract --code 21 --args \'{"example":{}}\'',
    },
    {
      description: 'Migrate a contract, with message from file',
      command: '<%= config.bin %> <%= command.id %> my-contract --code 21 --args-file="./migrateMsg.json"',
    },
    {
      description: 'Instantiate a contract, with message from stdin',
      command: dim('$ echo \'{"example":{}}\' | <%= config.bin %> <%= command.id %> my-contract --code 21'),
    },
  ];

  /**
   * Runs the command.
   *
   * @returns Promise containing a {@link MigrateResult}
   */
  public async run(): Promise<MigrateResult> {
    const config = await Config.init();
    const accountsDomain = Accounts.initFromFlags(this.flags, config);

    const from = await accountsDomain.getWithSigner(this.flags.from, config.defaultAccount);

    const { contractAddress, contractInstance, instantiateDeployment } = await this.getContractInfo(config);
    const migrateMsg = await parseContractMsgArgs(this.args, this.flags, false);

    if (!this.flags['no-validation'] && migrateMsg && contractInstance) {
      await config.contractsInstance.assertValidMigrateArgs(contractInstance.name, migrateMsg);
    }

    const contractName = contractInstance?.name || contractAddress;
    this.log(`Migrating contract ${blueBright(contractName)}`);
    this.log(`  Chain: ${blueBright(config.chainId)}`);
    this.log(`  Contract: ${blueBright(contractAddress)}`);
    this.log(`  Code: ${blueBright(this.flags.code)}`);
    this.log(`  Signer: ${blueBright(from.account.name)}\n`);

    const result = await showDisappearingSpinner(
      async () => this.migrate(config, from, contractAddress, migrateMsg),
      'Waiting for tx to confirm...'
    );

    if (contractInstance && instantiateDeployment) {
      await config.deploymentsInstance.addDeployment(
        {
          action: DeploymentAction.MIGRATE,
          txhash: result.transactionHash,
          wasm: {
            codeId: this.flags.code,
          },
          contract: {
            name: contractInstance.name,
            version: contractInstance.version,
            address: contractAddress,
            admin: instantiateDeployment.contract.admin,
          },
          msg: migrateMsg,
        } as MigrateDeployment,
        config.chainId
      );
    }

    this.success(`${greenBright('Contract')} ${blueBright(contractInstance?.label)} ${greenBright('migrated')}`);
    this.log(`  Transaction: ${config.prettyPrintTxHash(result.transactionHash)}`);

    return result;
  }

  private async migrate(config: Config, from: AccountWithSigner, contractAddress: string, migrationMessage: JsonObject): Promise<MigrateResult> {
    const signingClient = await ArchwayClientBuilder.getSigningArchwayClient(config, from, this.flags['gas-adjustment']);

    return signingClient.migrate(
      from.account.address,
      contractAddress,
      this.flags.code,
      migrationMessage,
      buildStdFee(this.flags.fee?.coin)
    );
  }

  private async getContractInfo(config: Config): Promise<{
    contractAddress: string;
    contractInstance?: Contract;
    instantiateDeployment?: InstantiateDeployment;
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

    return { contractAddress, contractInstance, instantiateDeployment };
  }
}
