import { DeploymentAction, DeploymentFile } from '../types/Deployment';

export class DeploymentsByChain {
  private _data: DeploymentFile;

  constructor(data: DeploymentFile) {
    this._data = data;
  }

  get data(): DeploymentFile {
    return this._data;
  }

  // to do: Add logic to read data from real files
  static async open(_chainId: string): Promise<DeploymentsByChain> {
    return new DeploymentsByChain({
      deployments: [
        {
          action: DeploymentAction.METADATA,
          txhash: 'EEA49C46AAECBF8B8F0F8A67F601A1265A40A5778B19867C75AD6087A84D8A2E',
          wasm: {
            codeId: 207,
          },
          contract: {
            name: 'my-contract',
            version: '0.1.0',
            address: 'archway17kan46qvsvz0j4jyy52scywwcer5vr5mwyd653jfvvqgxs9ghets9nekqh',
            admin: 'archway1ef8r7lwu6xtxkzhkmeufpcv7m3xy4gm5l2mazd',
          },
          metadata: {
            ownerAddress: 'archway1ef8r7lwu6xtxkzhkmeufpcv7m3xy4gm5l2mazd',
            rewardsAddress: 'archway1ef8r7lwu6xtxkzhkmeufpcv7m3xy4gm5l2mazd',
          },
        },
        {
          action: DeploymentAction.INSTANTIATE,
          txhash: 'A1F9F208C12B939E8F34FA8FE950EAD07E16FB6AFCBEE638384C60846339D86C',
          wasm: {
            codeId: 207,
          },
          contract: {
            name: 'my-contract',
            version: '0.1.0',
            address: 'archway17kan46qvsvz0j4jyy52scywwcer5vr5mwyd653jfvvqgxs9ghets9nekqh',
            admin: 'archway1ef8r7lwu6xtxkzhkmeufpcv7m3xy4gm5l2mazd',
          },
          msg: {
            count: 0,
          },
        },
        {
          action: DeploymentAction.STORE,
          txhash: '76B73AC422665CBAD3F796B78ED952E392538F668798377470D95999F2A74724',
          wasm: {
            codeId: 207,
            checksum: '144f0ee54b2b107b0b4895164d21e9127b86bde67c894e6a7f52f146f166b930',
          },
          contract: {
            name: 'my-contract',
            version: '0.1.0',
          },
        },
      ],
    });
  }
}
