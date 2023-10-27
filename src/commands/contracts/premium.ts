import { SetContractPremiumResult } from '@archwayhq/arch3.js';

import { Accounts, Config } from '@/domain';
import { NotFoundError } from '@/exceptions';
import { BaseCommand } from '@/lib/base';
import { ContractNameRequiredArg } from '@/parameters/arguments';
import { AmountRequiredFlag, KeyringFlags, TransactionFlags } from '@/parameters/flags';
import { ArchwayClientBuilder } from '@/services';
import { AccountWithSigner, Contract, DeploymentAction, InstantiateDeployment, PremiumDeployment } from '@/types';
import { showDisappearingSpinner } from '@/ui';
import { blueBright, buildStdFee, greenBright, isValidAddress, prettyPrintCoin } from '@/utils';

/**
 * Command 'contracts premium'
 * Sets the smart contract premium flat fee
 */
export default class ContractsPremium extends BaseCommand<typeof ContractsPremium> {
  static summary = 'Sets the smart contract\'s premium flat fee. The contract must have the rewards metadata already configured';
  static args = {
    contract: ContractNameRequiredArg,
  };

  static flags = {
    'premium-fee': AmountRequiredFlag,
    ...KeyringFlags,
    ...TransactionFlags,
  };

  static examples = [
    {
      description: 'Set the premium flat fee, by contract name',
      command: '<%= config.bin %> <%= command.id %> my-contract --premium-fee "1aconst"',
    },
    {
      description: 'Set the premium flat fee, by address',
      command: '<%= config.bin %> <%= command.id %> archway1dstndnaelj95ksruudc2ww4s9epn8m59xft7jz --premium-fee "1aconst"',
    },
    {
      description: 'Set the premium flat fee, from a specific account',
      command: '<%= config.bin %> <%= command.id %> my-contract --premium-fee "1aconst" --from "alice"',
    },
  ];

  /**
   * Runs the command.
   *
   * @returns A promise containing a {@link SetContractPremiumResult}
   */
  public async run(): Promise<SetContractPremiumResult> {
    const config = await Config.init();
    const accountsDomain = Accounts.initFromFlags(this.flags, config);

    const from = await accountsDomain.getWithSigner(this.flags.from, config.defaultAccount);

    const { contractAddress, contractInstance, instantiateDeployment } = await this.getContractInfo(config);

    const contractName = contractInstance?.name || contractAddress;
    this.log(`Setting premium for contract ${blueBright(contractName)}`);
    this.log(`  Chain: ${blueBright(config.chainId)}`);
    this.log(`  Contract: ${blueBright(contractAddress)}`);
    this.log(`  Premium: ${blueBright(prettyPrintCoin(this.flags['premium-fee']!.coin))}`);
    this.log(`  Signer: ${blueBright(from.account.name)}\n`);

    const result = await showDisappearingSpinner(
      async () => this.setPremium(config, from, contractAddress),
      'Waiting for tx to confirm...'
    );

    await this.addDeployment(config, result, contractAddress, contractInstance, instantiateDeployment);

    const label = contractInstance?.label || contractAddress;
    this.success(`${greenBright('Premium for the contract')} ${blueBright(label)} ${greenBright('updated')}`);
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

  // eslint-disable-next-line max-params
  private async addDeployment(
    config: Config,
    result: SetContractPremiumResult,
    contractAddress: string,
    contractInstance?: Contract,
    instantiateDeployment?: InstantiateDeployment,
  ): Promise<void> {
    if (!contractInstance || !instantiateDeployment) {
      return;
    }

    await config.deploymentsInstance.addDeployment(
      {
        action: DeploymentAction.PREMIUM,
        txhash: result.transactionHash,
        wasm: {
          codeId: instantiateDeployment.wasm.codeId,
        },
        contract: {
          name: contractInstance.name,
          version: contractInstance.version,
          address: contractAddress,
          admin: instantiateDeployment.contract.admin,
        },
        flatFee: result.premium.flatFee,
      } as PremiumDeployment,
      config.chainId
    );
  }

  private async setPremium(
    config: Config,
    from: AccountWithSigner,
    contractAddress: string
  ): Promise<SetContractPremiumResult> {
    const signingClient = await ArchwayClientBuilder.getSigningArchwayClient(config, from, this.flags['gas-adjustment']);

    return signingClient.setContractPremium(
      from.account.address,
      contractAddress,
      this.flags['premium-fee']!.coin,
      buildStdFee(this.flags.fee?.coin)
    );
  }
}
