import fs from 'node:fs/promises';
import path from 'node:path';

import { UploadResult } from '@cosmjs/cosmwasm-stargate';
import { Flags } from '@oclif/core';
import { AccessType } from 'cosmjs-types/cosmwasm/wasm/v1/types';

import { Accounts, Config, DEFAULT_ADDRESS_BECH_32_PREFIX } from '@/domain';
import { BaseCommand } from '@/lib/base';
import { ContractNameRequiredArg } from '@/parameters/arguments';
import { KeyringFlags, TransactionFlags } from '@/parameters/flags';
import { Prompts } from '@/services';
import { showDisappearingSpinner } from '@/ui';
import { assertIsValidAddress, blueBright, buildStdFee, greenBright, white, yellow } from '@/utils';

import { Account, Contract, DeploymentAction, InstantiatePermission, StoreDeployment } from '@/types';

/**
 * Command 'contracts store'
 * Stores a Wasm file on-chain
 */
export default class ContractsStore extends BaseCommand<typeof ContractsStore> {
  static summary = 'Stores a Wasm file on-chain';
  static args = {
    contract: ContractNameRequiredArg,
  };

  static flags = {
    'instantiate-permission': Flags.string({
      options: Object.keys(InstantiatePermission),
      default: 'everybody',
      description: 'Controls the instantiation permissions for the stored wasm file',
    }),
    'allowed-addresses': Flags.custom<string[]>({
      parse: async (val: string) => val.split(','),
      description:
        'List of addresses that can instantiate a contract from the code; works only if the instantiate permission is set to "any-of"',
    })(),
    ...KeyringFlags,
    ...TransactionFlags,
  };

  static examples = [
    {
      description: 'Store a contract on-chain',
      command: '<%= config.bin %> <%= command.id %> my-contract',
    },
    {
      description: 'Store a contract on-chain, without confirmation prompt',
      command: '<%= config.bin %> <%= command.id %> my-project --no-confirm',
    },
    {
      description: 'Store a contract on-chain, with list of addresses allowed to instantiate',
      command:
        '<%= config.bin %> <%= command.id %> my-project --instantiate-permission "any-of" --allowed-addresses "archway13lq4qvmydry3p394jrrfuv2z5xemzdnsplqdrm,archway1dstndnaelj95ksruudc2ww4s9epn8m59xft7jz"',
    },
    {
      description: 'Store a contract on-chain, with nobody allowed to instantiate',
      command: '<%= config.bin %> <%= command.id %> my-project --instantiate-permission "no-one"',
    },
  ];

  /**
   * Runs the command.
   *
   * @returns Empty promise
   */
  public async run(): Promise<UploadResult> {
    const config = await Config.init();

    await config.assertIsValidWorkspace();

    const contract = config.contractsInstance.getContractByName(this.args.contract!);

    const existingDeployment = await config.contractsInstance.isChecksumAlreadyDeployed(this.args.contract!, config.chainId);

    if (existingDeployment) {
      this.warning(
        yellow(
          `The current optimized build of the contract ${this.args.contract} with checksum ${white.reset(
            existingDeployment.wasm.checksum
          )} has already been deployed to ${white.reset(config.chainId)}`
        )
      );
      await Prompts.askForConfirmation(this.flags['no-confirm']);
    }

    const accountsDomain = await Accounts.initFromFlags(this.flags, config);

    const from = await accountsDomain.getWithSigner(this.flags.from, config.defaultAccount);

    const wasmCode = await fs.readFile(contract.wasm.optimizedFilePath);
    const allowedAddresses = this.flags['allowed-addresses'] || [];

    for (const auxAddress of allowedAddresses) {
      assertIsValidAddress(auxAddress, DEFAULT_ADDRESS_BECH_32_PREFIX);
    }

    await this.logTransactionDetails(config, contract, from.account);

    const result = await showDisappearingSpinner(async () => {
      const signingClient = await config.getSigningArchwayClient(from, this.flags['gas-adjustment']);

      return signingClient.upload(from.account.address, wasmCode, buildStdFee(this.flags.fee?.coin), undefined, {
        permission:
          AccessType[
            InstantiatePermission[this.flags['instantiate-permission'] as keyof typeof InstantiatePermission] as keyof typeof AccessType
          ],
        address: '', // Deprecated param, replaced with addresses
        addresses: allowedAddresses,
      });
    }, 'Waiting for tx to confirm...');

    await config.deploymentsInstance.addDeployment(
      {
        action: DeploymentAction.STORE,
        txhash: result!.transactionHash,
        wasm: {
          codeId: result!.codeId,
          checksum: result!.checksum,
        },
        contract: {
          name: contract.name,
          version: contract.version,
        },
      } as StoreDeployment,
      config.chainId
    );

    this.success(`${greenBright('Contract')} ${blueBright(path.basename(contract.wasm.optimizedFilePath))} ${greenBright('uploaded')}`);
    this.log(`  Code Id: ${blueBright(result.codeId)}`);
    this.log(`  Transaction: ${await config.prettyPrintTxHash(result.transactionHash)}`);

    return result;
  }

  protected async logTransactionDetails(config: Config, contract: Contract, fromAccount: Account): Promise<void> {
    this.log(`Uploading optimized wasm for contract ${blueBright(contract.name)}`);
    this.log(`  Chain: ${blueBright(config.chainId)}`);
    this.log(`  Signer: ${blueBright(fromAccount.name)}\n`);
  }
}
