import { Args, Flags } from '@oclif/core';
import { MigrateResult } from '@cosmjs/cosmwasm-stargate';
import fs from 'node:fs/promises';

import { BaseCommand } from '@/lib/base';
import { ParamsContractNameRequiredArg, StdinInputArg } from '@/parameters/arguments';
import { Accounts, Config } from '@/domain';
import { buildStdFee, blueBright, greenBright } from '@/utils';
import { showDisappearingSpinner } from '@/ui';
import { KeyringFlags, TransactionFlags } from '@/parameters/flags';
import { NotFoundError, OnlyOneArgSourceError } from '@/exceptions';

import { Account, BackendType, Contract, DeploymentAction, MigrateDeployment } from '@/types';

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

    // Load config and contract info
    const config = await Config.init();
    await config.assertIsValidWorkspace();
    const contract = config.contractsInstance.getContractByName(this.args.contract!);
    const accountsDomain = await Accounts.init(this.flags['keyring-backend'] as BackendType, { filesPath: this.flags['keyring-path'] });
    const from = await accountsDomain.getWithSigner(this.flags.from!);

    const instantiated = config.contractsInstance.findInstantiateDeployment(this.args.contract!, config.chainId);

    if (!instantiated) throw new NotFoundError('Instantiated deployment with a contract address');

    const contractAddress = instantiated.contract.address;

    this.logTransactionDetails(config, contract, contractAddress, from.account);

    // Parse migrate message (if exists)
    const message =
      this.flags.args || this.args.stdinInput || this.flags['args-file'] ?
        JSON.parse(this.flags.args || this.args.stdinInput || (await fs.readFile(this.flags['args-file']!, 'utf-8'))) :
        {};

    const result = await showDisappearingSpinner(async () => {
      const signingClient = await config.getSigningArchwayClient(from, this.flags['gas-adjustment']);

      return signingClient.migrate(from.account.address, contractAddress, this.flags.code!, message, buildStdFee(this.flags.fee?.coin));
    }, 'Waiting for tx to confirm...');

    await config.deploymentsInstance.addDeployment(
      {
        action: DeploymentAction.MIGRATE,
        txhash: result!.transactionHash,
        wasm: {
          codeId: this.flags.code,
        },
        contract: {
          name: contract.name,
          version: contract.version,
          address: contractAddress,
          admin: instantiated.contract.admin,
        },
        msg: message,
      } as MigrateDeployment,
      config.chainId
    );

    await this.successMessage(result!, contract.label, config);
  }

  protected async logTransactionDetails(config: Config, contract: Contract, contractAddress: string, fromAccount: Account): Promise<void> {
    this.log(`Migrating contract ${blueBright(contract.name)}`);
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
