import { Args, Flags } from '@oclif/core';
import { MigrateResult } from '@cosmjs/cosmwasm-stargate';
import fs from 'node:fs/promises';

import { BaseCommand } from '@/lib/base';
import { ParamsContractNameRequiredArg, StdinInputArg } from '@/parameters/arguments';
import { Accounts, Config } from '@/domain';
import { buildStdFee, blueBright, greenBright, isValidAddress } from '@/utils';
import { showDisappearingSpinner } from '@/ui';
import { KeyringFlags, TransactionFlags } from '@/parameters/flags';
import { NotFoundError, OnlyOneArgSourceError } from '@/exceptions';

import { Account, Contract, DeploymentAction, InstantiateDeployment, MigrateDeployment } from '@/types';

/**
 * Command 'contracts migrate'
 * Runs a contract migration
 */
export default class ContractsMigrate extends BaseCommand<typeof ContractsMigrate> {
  static summary = 'Runs a contract migration';
  static args = {
    contract: Args.string({ ...ParamsContractNameRequiredArg, ignoreStdin: true }),
    stdinInput: StdinInputArg,
  };

  static flags = {
    ...KeyringFlags,
    ...TransactionFlags,
    code: Flags.integer({ description: 'New code stored', required: true }),
    args: Flags.string({
      description: 'JSON string with a message to be passed to the contract on migration',
    }),
    'args-file': Flags.string({ description: 'Path to a JSON file with a message to be passed to the contract on migration' }),
  };

  /**
   * Runs the command.
   *
   * @returns Empty promise
   */
  public async run(): Promise<void> {
    // Validate that we only get migration message args from one source of all 3 possible inputs
    if (
      (this.flags['args-file'] && this.args.stdinInput) ||
      (this.flags['args-file'] && this.flags.args) ||
      (this.flags.args && this.args.stdinInput)
    ) {
      throw new OnlyOneArgSourceError('Migration message');
    }

    const config = await Config.init();
    const accountsDomain = await Accounts.initFromFlags(this.flags, config);

    const from = await accountsDomain.getWithSigner(this.flags.from, config.defaultAccount);

    // Load contract info
    let contractAddress: string;
    let contractInstance: Contract | undefined;
    let instantiateDeployment: InstantiateDeployment | undefined;

    // Parse migrate message (if exists)
    const migrationMessage =
      this.args.stdinInput || this.flags.args || this.flags['args-file'] ?
        JSON.parse(this.args.stdinInput || this.flags.args || (await fs.readFile(this.flags['args-file']!, 'utf-8'))) :
        {};

    if (isValidAddress(this.args.contract!)) {
      contractAddress = this.args.contract!;
    } else {
      await config.assertIsValidWorkspace();

      contractInstance = config.contractsInstance.getContractByName(this.args.contract!);

      instantiateDeployment = config.contractsInstance.findInstantiateDeployment(contractInstance.name, config.chainId);

      if (!instantiateDeployment) throw new NotFoundError('Instantiated deployment with a contract address');

      contractAddress = instantiateDeployment.contract.address;
    }

    this.logTransactionDetails(config, contractInstance?.name || contractAddress, contractAddress, from.account);

    const result = await showDisappearingSpinner(async () => {
      const signingClient = await config.getSigningArchwayClient(from, this.flags['gas-adjustment']);

      return signingClient.migrate(
        from.account.address,
        contractAddress,
        this.flags.code!,
        migrationMessage,
        buildStdFee(this.flags.fee?.coin)
      );
    }, 'Waiting for tx to confirm...');

    if (contractInstance && instantiateDeployment) {
      await config.deploymentsInstance.addDeployment(
        {
          action: DeploymentAction.MIGRATE,
          txhash: result!.transactionHash,
          wasm: {
            codeId: this.flags.code,
          },
          contract: {
            name: contractInstance.name,
            version: contractInstance.version,
            address: contractAddress,
            admin: instantiateDeployment.contract.admin,
          },
          msg: migrationMessage,
        } as MigrateDeployment,
        config.chainId
      );
    }

    await this.successMessage(result!, contractInstance?.label || contractAddress, config);
  }

  protected async logTransactionDetails(
    config: Config,
    contractName: string,
    contractAddress: string,
    fromAccount: Account
  ): Promise<void> {
    this.log(`Migrating contract ${blueBright(contractName)}`);
    this.log(`  Chain: ${blueBright(config.chainId)}`);
    this.log(`  Contract: ${blueBright(contractAddress)}`);
    this.log(`  Code: ${blueBright(this.flags.code)}`);
    this.log(`  Signer: ${blueBright(fromAccount.name)}\n`);
  }

  protected async successMessage(result: MigrateResult, label: string, configInstance: Config): Promise<void> {
    if (this.jsonEnabled()) {
      this.logJson(result);
    } else {
      this.success(`${greenBright('Contract')} ${blueBright(label)} ${greenBright('migrated')}`);
      this.log(`  Transaction: ${await configInstance.prettyPrintTxHash(result.transactionHash)}`);
    }
  }
}
