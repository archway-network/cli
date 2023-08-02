import { Flags } from '@oclif/core';
import { SetContractMetadataResult } from '@archwayhq/arch3.js';

import { BaseCommand } from '@/lib/base';
import { ContractNameRequiredArg } from '@/arguments';
import { Accounts, Config } from '@/domain';
import { buildStdFee, blue } from '@/utils';
import { showSpinner } from '@/ui';
import { KeyringFlags, TransactionFlags } from '@/flags';
import { NotFoundError } from '@/exceptions';
import { SuccessMessages } from '@/services';

import { AccountWithMnemonic, BackendType, DeploymentAction, MetadataDeployment } from '@/types';

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
    await config.contractsInstance.assertValidWorkspace();
    const contract = config.contractsInstance.assertGetContractByName(this.args.contract!);
    const accountsDomain = await Accounts.init(this.flags['keyring-backend'] as BackendType, { filesPath: this.flags['keyring-path'] });
    const fromAccount: AccountWithMnemonic = await accountsDomain.getWithMnemonic(this.flags.from!);

    const instantiated = config.contractsInstance.findInstantiateDeployment(this.args.contract!, config.chainId);

    if (!instantiated) throw new NotFoundError('Instantiated deployment with a contract address');

    const contractAddress = instantiated.contract.address;

    const ownerAddress = this.flags['owner-address'] ?
      (await accountsDomain.accountBaseFromAddress(this.flags['owner-address'])).address :
      undefined;
    const rewardsAddress = this.flags['rewards-address'] ?
      (await accountsDomain.accountBaseFromAddress(this.flags['rewards-address'])).address :
      undefined;

    // Log message that we are starting the transaction
    this.log(`Setting metadata for contract ${blue(contract.name)}`);
    this.log(`  Chain: ${blue(config.chainId)}`);
    this.log(`  Contract: ${blue(contractAddress)}`);
    this.log(`  Rewards: ${blue(rewardsAddress)}`);
    this.log(`  Owner: ${blue(ownerAddress)}`);
    this.log(`  Signer: ${blue(fromAccount.name)}\n`);

    let result: SetContractMetadataResult;

    await showSpinner(async () => {
      const signingClient = await config.getSigningArchwayClient(fromAccount);

      result = await signingClient.setContractMetadata(
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

    await SuccessMessages.contracts.metadata(this, result!, contract.label, config);
  }
}
