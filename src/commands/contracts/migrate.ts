import { Args, Flags } from '@oclif/core';
import { MigrateResult } from '@cosmjs/cosmwasm-stargate';
import fs from 'node:fs/promises';

import { BaseCommand } from '@/lib/base';
import { definitionContractNameRequired, stdinInput } from '@/arguments';
import { Accounts, Config } from '@/domain';
import { buildStdFee, blue, green } from '@/utils';
import { showSpinner } from '@/ui';
import { KeyringFlags, TransactionFlags } from '@/flags';
import { NotFoundError, OnlyOneArgSourceError } from '@/exceptions';

import { AccountWithMnemonic, BackendType, DeploymentAction, MigrateDeployment } from '@/types';

/**
 * Command 'contracts migrate'
 * Runs a contract migration
 */
export default class ContractsMigrate extends BaseCommand<typeof ContractsMigrate> {
  static summary = 'Runs a contract migration';
  static args = {
    contract: Args.string({ ...definitionContractNameRequired, ignoreStdin: true }),
    stdinInput,
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
    const config = await Config.open();
    await config.contractsInstance.assertValidWorkspace();
    const contract = config.contractsInstance.assertGetContractByName(this.args.contract!);
    const accountsDomain = await Accounts.init(this.flags['keyring-backend'] as BackendType, { filesPath: this.flags['keyring-path'] });
    const fromAccount: AccountWithMnemonic = await accountsDomain.getWithMnemonic(this.flags.from!);

    const instantiated = await config.contractsInstance.findInstantiateDeployment(this.args.contract!, config.chainId);

    if (!instantiated) throw new NotFoundError('Instantiated deployment with a contract address');

    const contractAddress = instantiated.contract.address;

    // Log message that we are starting the transaction
    this.log(`Migrating contract ${blue(contract.name)}`);
    this.log(`  Chain: ${blue(config.chainId)}`);
    this.log(`  Contract: ${blue(contractAddress)}`);
    this.log(`  Code: ${blue(this.flags.code)}`);
    this.log(`  Signer: ${blue(fromAccount.name)}\n`);

    // Parse migrate message (if exists)
    const message =
      this.flags.args || this.args.stdinInput || this.flags['args-file'] ?
        JSON.parse(this.flags.args || this.args.stdinInput || (await fs.readFile(this.flags['args-file']!, 'utf-8'))) :
        undefined;

    let result: MigrateResult;

    await showSpinner(async () => {
      const signingClient = await config.getSigningArchwayClient(fromAccount);

      result = await signingClient.migrate(
        fromAccount.address,
        contractAddress,
        this.flags.code!,
        message,
        buildStdFee(this.flags.fee?.coin)
      );
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
        msg: message
      } as MigrateDeployment,
      config.chainId
    );

    if (this.jsonEnabled()) {
      this.logJson(result!);
    }

    this.success(`${green('Contract')} ${blue(contract.label)} ${green('migrated')}`);
    this.log(`  Transaction: ${await config.prettyPrintTxHash(result!.transactionHash)}`);
  }
}
