import { ContractMetadata, SetContractMetadataResult } from '@archwayhq/arch3.js';
import { Flags } from '@oclif/core';

import { Accounts, Config } from '@/domain';
import { NotFoundError } from '@/exceptions';
import { BaseCommand } from '@/lib/base';
import { ContractNameRequiredArg } from '@/parameters/arguments';
import { KeyringFlags, TransactionFlags } from '@/parameters/flags';
import { ArchwayClientBuilder } from '@/services';
import { Account, AccountWithSigner, Contract, DeploymentAction, InstantiateDeployment, MetadataDeployment } from '@/types';
import { showDisappearingSpinner } from '@/ui';
import { blueBright, buildStdFee, greenBright, isValidAddress } from '@/utils';

/**
 * Command 'contracts metadata'
 * Sets a smart contracts rewards metadata
 */
export default class ContractsMetadata extends BaseCommand<typeof ContractsMetadata> {
  static summary = 'Sets a smart contracts rewards metadata';
  static args = {
    contract: ContractNameRequiredArg,
  };

  static flags = {
    'owner-address': Flags.string({ description: 'Owner of the contract metadata' }),
    'rewards-address': Flags.string({ description: 'Rewards destination address' }),
    ...KeyringFlags,
    ...TransactionFlags,
  };

  static examples = [
    {
      description: 'Set the rewards metadata, by contract name',
      command: '<%= config.bin %> <%= command.id %> my-contract --owner-address "archway13lq4qvmydry3p394jrrfuv2z5xemzdnsplqdrm" --rewards-address="archway13lq4qvmydry3p394jrrfuv2z5xemzdnsplqdrm"',
    },
    {
      description: 'Set the rewards metadata, by address',
      command: '<%= config.bin %> <%= command.id %> archway1dstndnaelj95ksruudc2ww4s9epn8m59xft7jz --owner-address "archway13lq4qvmydry3p394jrrfuv2z5xemzdnsplqdrm" --rewards-address="archway13lq4qvmydry3p394jrrfuv2z5xemzdnsplqdrm"',
    },
    {
      description: 'Set the rewards metadata, from a specific account',
      command: '<%= config.bin %> <%= command.id %> my-contract --owner-address "archway13lq4qvmydry3p394jrrfuv2z5xemzdnsplqdrm" --rewards-address="archway13lq4qvmydry3p394jrrfuv2z5xemzdnsplqdrm" --from "alice"',
    },
  ];

  /**
   * Runs the command.
   *
   * @returns A promise containing a {@link SetContractMetadataResult}
   */
  public async run(): Promise<SetContractMetadataResult> {
    this.validateArgs();

    const config = await Config.init();
    const accountsDomain = Accounts.initFromFlags(this.flags, config);

    const from = await accountsDomain.getWithSigner(this.flags.from, config.defaultAccount);

    const ownerAddress = this.getOwnerAddress(accountsDomain);
    const rewardsAddress = this.getRewardsAddress(accountsDomain);
    const { contractAddress, contractInstance, instantiateDeployment } = await this.getContractInfo(config);

    const metadata: ContractMetadata = {
      contractAddress,
      ownerAddress,
      rewardsAddress,
    };

    this.logTransactionDetails(
      config,
      contractInstance?.name || contractAddress,
      from.account,
      metadata
    );

    const result = await showDisappearingSpinner(
      async () => this.setContractMetadata(config, from, metadata),
      'Waiting for tx to confirm...'
    );

    await this.addDeployment(config, result, contractInstance, instantiateDeployment);

    const label = contractInstance?.label || contractAddress;
    this.success(`${greenBright('Metadata for the contract')} ${blueBright(label)} ${greenBright('updated')}`);
    this.log(`  Transaction: ${config.prettyPrintTxHash(result.transactionHash)}`);

    return result;
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

  private getRewardsAddress(accountsDomain: Accounts): string | undefined {
    return this.flags['rewards-address']
      ? accountsDomain.accountBaseFromAddress(this.flags['rewards-address']).address
      : undefined;
  }

  private getOwnerAddress(accountsDomain: Accounts): string | undefined {
    return this.flags['owner-address']
      ? accountsDomain.accountBaseFromAddress(this.flags['owner-address']).address
      : undefined;
  }

  private validateArgs(): void {
    if (!this.flags['owner-address'] && !this.flags['rewards-address']) {
      throw new NotFoundError('Metadata values in flags "owner-address" and "rewards-address');
    }
  }

  private async setContractMetadata(
    config: Config,
    from: AccountWithSigner,
    metadata: ContractMetadata
  ): Promise<SetContractMetadataResult> {
    const signingClient = await ArchwayClientBuilder.getSigningArchwayClient(config, from, this.flags['gas-adjustment']);

    return signingClient.setContractMetadata(
      from.account.address,
      metadata,
      buildStdFee(this.flags.fee?.coin)
    );
  }

  private async addDeployment(
    config: Config,
    result: SetContractMetadataResult,
    contractInstance?: Contract,
    instantiateDeployment?: InstantiateDeployment
  ): Promise<void> {
    if (contractInstance && instantiateDeployment) {
      await config.deploymentsInstance.addDeployment(
        {
          action: DeploymentAction.METADATA,
          txhash: result.transactionHash,
          wasm: {
            codeId: instantiateDeployment.wasm.codeId,
          },
          contract: {
            name: contractInstance.name,
            version: contractInstance.version,
            address: result.metadata.contractAddress,
            admin: instantiateDeployment.contract.admin,
          },
          metadata: result.metadata,
        } as MetadataDeployment,
        config.chainId
      );
    }
  }

  private logTransactionDetails(
    config: Config,
    contractName: string,
    fromAccount: Account,
    metadata: ContractMetadata
  ): void {
    this.log(`Setting metadata for contract ${blueBright(contractName)}`);
    this.log(`  Chain: ${blueBright(config.chainId)}`);
    this.log(`  Contract: ${blueBright(metadata.contractAddress)}`);

    if (metadata.rewardsAddress) {
      this.log(`  Rewards: ${blueBright(metadata.rewardsAddress)}`);
    }

    if (metadata.ownerAddress) {
      this.log(`  Owner: ${blueBright(metadata.ownerAddress)}`);
    }

    this.log(`  Signer: ${blueBright(fromAccount.name)}\n`);
  }
}
