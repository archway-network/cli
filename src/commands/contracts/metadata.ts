import { Flags } from '@oclif/core';
import { SetContractMetadataResult } from '@archwayhq/arch3.js';

import { BaseCommand } from '@/lib/base';
import { ContractNameRequiredArg } from '@/parameters/arguments';
import { Accounts, Config } from '@/domain';
import { buildStdFee, blueBright, greenBright, isValidAddress } from '@/utils';
import { showDisappearingSpinner } from '@/ui';
import { KeyringFlags, TransactionFlags } from '@/parameters/flags';
import { NotFoundError } from '@/exceptions';

import { Account, Contract, DeploymentAction, InstantiateDeployment, MetadataDeployment } from '@/types';

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
   * @returns Empty promise
   */
  public async run(): Promise<void> {
    const config = await Config.init();
    const accountsDomain = await Accounts.initFromFlags(this.flags, config);

    const from = await accountsDomain.getWithSigner(this.flags.from, config.defaultAccount);

    const ownerAddress = this.flags['owner-address'] ?
      (await accountsDomain.accountBaseFromAddress(this.flags['owner-address'])).address :
      undefined;
    const rewardsAddress = this.flags['rewards-address'] ?
      (await accountsDomain.accountBaseFromAddress(this.flags['rewards-address'])).address :
      undefined;

    // Load contract info
    let contractAddress: string;
    let contractInstance: Contract | undefined;
    let instantiateDeployment: InstantiateDeployment | undefined;

    if (isValidAddress(this.args.contract!)) {
      contractAddress = this.args.contract!;
    } else {
      await config.assertIsValidWorkspace();

      contractInstance = config.contractsInstance.getContractByName(this.args.contract!);
      instantiateDeployment = config.contractsInstance.findInstantiateDeployment(contractInstance.name, config.chainId);

      if (!instantiateDeployment) throw new NotFoundError('Instantiated deployment with a contract address');

      contractAddress = instantiateDeployment.contract.address;
    }

    await this.logTransactionDetails(
      config,
      contractInstance?.name || contractAddress,
      from.account,
      contractAddress,
      rewardsAddress,
      ownerAddress
    );

    const result = await showDisappearingSpinner(async () => {
      const signingClient = await config.getSigningArchwayClient(from, this.flags['gas-adjustment']);

      return signingClient.setContractMetadata(
        from.account.address,
        {
          contractAddress,
          ownerAddress,
          rewardsAddress,
        },
        buildStdFee(this.flags.fee?.coin)
      );
    }, 'Waiting for tx to confirm...');

    if (contractInstance && instantiateDeployment) {
      await config.deploymentsInstance.addDeployment(
        {
          action: DeploymentAction.METADATA,
          txhash: result!.transactionHash,
          wasm: {
            codeId: instantiateDeployment.wasm.codeId,
          },
          contract: {
            name: contractInstance.name,
            version: contractInstance.version,
            address: contractAddress,
            admin: instantiateDeployment.contract.admin,
          },
          metadata: result!.metadata,
        } as MetadataDeployment,
        config.chainId
      );
    }

    await this.successMessage(result!, contractInstance?.label || contractAddress, config);
  }

  // eslint-disable-next-line max-params
  protected async logTransactionDetails(
    config: Config,
    contractName: string,
    fromAccount: Account,
    contractAddress: string,
    rewardsAddress?: string,
    ownerAddress?: string
  ): Promise<void> {
    this.log(`Setting metadata for contract ${blueBright(contractName)}`);
    this.log(`  Chain: ${blueBright(config.chainId)}`);
    this.log(`  Contract: ${blueBright(contractAddress)}`);
    if (rewardsAddress) this.log(`  Rewards: ${blueBright(rewardsAddress)}`);
    if (ownerAddress) this.log(`  Owner: ${blueBright(ownerAddress)}`);
    this.log(`  Signer: ${blueBright(fromAccount.name)}\n`);
  }

  protected async successMessage(result: SetContractMetadataResult, label: string, configInstance: Config): Promise<void> {
    if (this.jsonEnabled()) {
      this.logJson(result);
    } else {
      this.success(`${greenBright('Metadata for the contract')} ${blueBright(label)} ${greenBright('updated')}`);
      this.log(`  Transaction: ${await configInstance.prettyPrintTxHash(result.transactionHash)}`);
    }
  }
}
