import { Flags } from '@oclif/core';
import { SetContractMetadataResult } from '@archwayhq/arch3.js';

import { BaseCommand } from '@/lib/base';
import { ContractNameRequiredArg } from '@/parameters/arguments';
import { Accounts, Config } from '@/domain';
import { buildStdFee, blue, green } from '@/utils';
import { showDisappearingSpinner } from '@/ui';
import { KeyringFlags, TransactionFlags } from '@/parameters/flags';
import { NotFoundError } from '@/exceptions';

import { Account, BackendType, Contract, DeploymentAction, MetadataDeployment } from '@/types';

/**
 * Command 'contracts metadata'
 * Sets a contract rewards metadata
 */
export default class ContractsMetadata extends BaseCommand<typeof ContractsMetadata> {
  static summary = 'Sets a contract rewards metadata';
  static args = {
    contract: ContractNameRequiredArg,
  };

  static flags = {
    'owner-address': Flags.string({ description: 'Owner of the contract metadata' }),
    'rewards-address': Flags.string({ description: 'Rewards destination address' }),
    ...KeyringFlags,
    ...TransactionFlags,
  };

  /**
   * Runs the command.
   *
   * @returns Empty promise
   */
  public async run(): Promise<void> {
    // Load config and contract info
    const config = await Config.init();
    await config.assertIsValidWorkspace();
    const contract = config.contractsInstance.getContractByName(this.args.contract!);
    const accountsDomain = await Accounts.init(this.flags['keyring-backend'] as BackendType, { filesPath: this.flags['keyring-path'] });
    const fromAccount: Account = await accountsDomain.getWithMnemonic(this.flags.from!);

    const instantiated = config.contractsInstance.findInstantiateDeployment(this.args.contract!, config.chainId);

    if (!instantiated) throw new NotFoundError('Instantiated deployment with a contract address');

    const contractAddress = instantiated.contract.address;

    const ownerAddress = this.flags['owner-address'] ?
      (await accountsDomain.accountBaseFromAddress(this.flags['owner-address'])).address :
      undefined;
    const rewardsAddress = this.flags['rewards-address'] ?
      (await accountsDomain.accountBaseFromAddress(this.flags['rewards-address'])).address :
      undefined;

    await this.logTransactionDetails(config, contract, fromAccount, contractAddress, rewardsAddress, ownerAddress);

    const result = await showDisappearingSpinner(async () => {
      const signingClient = await config.getSigningArchwayClient(fromAccount);

      return signingClient.setContractMetadata(
        fromAccount.address,
        {
          contractAddress,
          ownerAddress,
          rewardsAddress,
        },
        buildStdFee(this.flags.fee?.coin)
      );
    }, 'Waiting for tx to confirm...');

    await config.deploymentsInstance.addDeployment(
      {
        action: DeploymentAction.METADATA,
        txhash: result!.transactionHash,
        wasm: {
          codeId: instantiated.wasm.codeId,
        },
        contract: {
          name: contract.name,
          version: contract.version,
          address: contractAddress,
          admin: instantiated.contract.admin,
        },
        metadata: result!.metadata,
      } as MetadataDeployment,
      config.chainId
    );

    await this.successMessage(result!, contract.label, config);
  }

  // eslint-disable-next-line max-params
  protected async logTransactionDetails(
    config: Config,
    contract: Contract,
    fromAccount: Account,
    contractAddress: string,
    rewardsAddress?: string,
    ownerAddress?: string
  ): Promise<void> {
    this.log(`Setting metadata for contract ${blue(contract.name)}`);
    this.log(`  Chain: ${blue(config.chainId)}`);
    this.log(`  Contract: ${blue(contractAddress)}`);
    if (rewardsAddress) this.log(`  Rewards: ${blue(rewardsAddress)}`);
    if (ownerAddress) this.log(`  Owner: ${blue(ownerAddress)}`);
    this.log(`  Signer: ${blue(fromAccount.name)}\n`);
  }

  protected async successMessage(result: SetContractMetadataResult, label: string, configInstance: Config): Promise<void> {
    if (this.jsonEnabled()) {
      this.logJson(result);
    } else {
      this.success(`${green('Metadata for the contract')} ${blue(label)} ${green('updated')}`);
      this.log(`  Transaction: ${await configInstance.prettyPrintTxHash(result.transactionHash)}`);
    }
  }
}
