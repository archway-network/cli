import fs from 'node:fs/promises';
import path from 'node:path';

import { UploadResult } from '@cosmjs/cosmwasm-stargate';
import { Flags } from '@oclif/core';
import { AccessConfig, AccessType } from 'cosmjs-types/cosmwasm/wasm/v1/types';

import { Accounts, Config, DEFAULT_ADDRESS_BECH_32_PREFIX } from '@/domain';
import { BaseCommand } from '@/lib/base';
import { ContractNameRequiredArg } from '@/parameters/arguments';
import { KeyringFlags, TransactionFlags } from '@/parameters/flags';
import { ArchwayClientBuilder, Prompts } from '@/services';
import { AccountWithSigner, DeploymentAction, InstantiatePermission, StoreDeployment } from '@/types';
import { showDisappearingSpinner } from '@/ui';
import { assertIsValidAddress, blueBright, buildStdFee, greenBright, white } from '@/utils';

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
      parse: (val: string): Promise<string[]> => Promise.resolve(val.split(',')),
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
   * @returns A promise containing a {@link UploadResult}
   */
  public async run(): Promise<UploadResult> {
    const config = await Config.init();
    await config.assertIsValidWorkspace();

    await this.checkExistingDeployment(config);

    const accountsDomain = Accounts.initFromFlags(this.flags, config);

    const from = await accountsDomain.getWithSigner(this.flags.from, config.defaultAccount);

    const allowedAddresses = this.flags['allowed-addresses'] || [];
    for (const auxAddress of allowedAddresses) {
      assertIsValidAddress(auxAddress, DEFAULT_ADDRESS_BECH_32_PREFIX);
    }

    const contract = config.contractsInstance.getContractByName(this.args.contract!);

    const wasmCode = await showDisappearingSpinner(
      async () => fs.readFile(contract.wasm.optimizedFilePath),
      `Reading WASM file ${contract.wasm.optimizedFilePath}`
    );

    this.log(`Uploading optimized wasm for contract ${blueBright(contract.name)}`);
    this.log(`  Chain: ${blueBright(config.chainId)}`);
    this.log(`  Signer: ${blueBright(from.account.name)}\n`);

    const result = await showDisappearingSpinner(
      async () => this.upload(config, from, wasmCode, allowedAddresses),
      'Waiting for tx to confirm...'
    );

    await config.deploymentsInstance.addDeployment(
      {
        action: DeploymentAction.STORE,
        txhash: result.transactionHash,
        wasm: {
          codeId: result.codeId,
          checksum: result.checksum,
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
    this.log(`  Transaction: ${config.prettyPrintTxHash(result.transactionHash)}`);

    return result;
  }

  private async checkExistingDeployment(config: Config): Promise<void> {
    const existingDeployment = await config.contractsInstance.isChecksumAlreadyDeployed(this.args.contract!, config.chainId);
    if (existingDeployment) {
      this.warning(
        `The current build of the contract ${blueBright(this.args.contract)} with checksum ${white.reset(
          existingDeployment.wasm.checksum
        )} has already been deployed to ${blueBright(config.chainId)}`
      );
      await Prompts.askForConfirmation(this.flags['no-confirm']);
    }
  }

  private async upload(
    config: Config,
    from: AccountWithSigner,
    wasmCode: Buffer,
    allowedAddresses: string[]
  ): Promise<UploadResult> {
    const signingClient = await ArchwayClientBuilder.getSigningArchwayClient(config, from, this.flags['gas-adjustment']);

    const permission = AccessType[InstantiatePermission[this.flags['instantiate-permission'] as keyof typeof InstantiatePermission] as keyof typeof AccessType];
    const instantiatePermission: AccessConfig = {
      permission,
      address: '',
      addresses: allowedAddresses,
    };

    return signingClient.upload(
      from.account.address,
      wasmCode,
      buildStdFee(this.flags.fee?.coin),
      undefined,
      instantiatePermission
    );
  }
}
