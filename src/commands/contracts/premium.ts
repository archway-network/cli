import { SetContractPremiumResult } from '@archwayhq/arch3.js';

import { BaseCommand } from '@/lib/base';
import { ContractNameRequiredArg } from '@/parameters/arguments';
import { Accounts, Config } from '@/domain';
import { buildStdFee, blueBright, greenBright, prettyPrintCoin, isValidAddress } from '@/utils';
import { showDisappearingSpinner } from '@/ui';
import { KeyringFlags, TransactionFlags, AmountRequiredFlag } from '@/parameters/flags';
import { NotFoundError } from '@/exceptions';

import { Account, Contract, DeploymentAction, InstantiateDeployment, PremiumDeployment } from '@/types';

/**
 * Command 'contracts premium'
 * Sets the smart contract premium flat fee
 */
export default class ContractsPremium extends BaseCommand<typeof ContractsPremium> {
  static summary = 'Sets the smart contract\'s premium flat fee. It is required to set the metadata of your contract before you can set a premium.';
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
   * @returns Empty promise
   */
  public async run(): Promise<void> {
    const config = await Config.init();
    const accountsDomain = await Accounts.initFromFlags(this.flags, config);

    const from = await accountsDomain.getWithSigner(this.flags.from, config.defaultAccount);

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

    await this.logTransactionDetails(config, contractInstance?.name || contractAddress, contractAddress, from.account);

    const result = await showDisappearingSpinner(async () => {
      const signingClient = await config.getSigningArchwayClient(from, this.flags['gas-adjustment']);

      return signingClient.setContractPremium(
        from.account.address,
        contractAddress,
        this.flags['premium-fee']!.coin,
        buildStdFee(this.flags.fee?.coin)
      );
    }, 'Waiting for tx to confirm...');

    if (contractInstance && instantiateDeployment) {
      await config.deploymentsInstance.addDeployment(
        {
          action: DeploymentAction.PREMIUM,
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
          flatFee: result!.premium.flatFee,
        } as PremiumDeployment,
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
    this.log(`Setting premium for contract ${blueBright(contractName)}`);
    this.log(`  Chain: ${blueBright(config.chainId)}`);
    this.log(`  Contract: ${blueBright(contractAddress)}`);
    this.log(`  Premium: ${blueBright(prettyPrintCoin(this.flags['premium-fee']!.coin))}`);
    this.log(`  Signer: ${blueBright(fromAccount.name)}\n`);
  }

  protected async successMessage(result: SetContractPremiumResult, label: string, configInstance: Config): Promise<void> {
    if (this.jsonEnabled()) {
      this.logJson(result);
    } else {
      this.success(`${greenBright('Premium for the contract')} ${blueBright(label)} ${greenBright('updated')}`);
      this.log(`  Transaction: ${await configInstance.prettyPrintTxHash(result.transactionHash)}`);
    }
  }
}
