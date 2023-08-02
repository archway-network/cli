/* eslint-disable camelcase */
import { UploadResult } from '@cosmjs/cosmwasm-stargate';

export const dummyStoreTransaction: UploadResult = {
  originalSize: 126_797,
  originalChecksum: '7994a044ed70c1fad224af08e910dc893643ee6f5069e0eb124bdd4f92759dca',
  compressedSize: 47_022,
  compressedChecksum: '6beb49c19c9c5d35aef4e8c4995acf436ff495295e73a64793ab872c0835d888',
  codeId: 975,
  logs: [
    {
      msg_index: 0,
      log: '',
      events: [
        {
          type: 'message',
          attributes: [
            {
              key: 'action',
              value: '/cosmwasm.wasm.v1.MsgStoreCode',
            },
            {
              key: 'module',
              value: 'wasm',
            },
            {
              key: 'sender',
              value: 'archway1w8uad5ddvadfv3vdjrt3d8f3famnrg4msd43zv',
            },
          ],
        },
        {
          type: 'store_code',
          attributes: [
            {
              key: 'code_checksum',
              value: '7994a044ed70c1fad224af08e910dc893643ee6f5069e0eb124bdd4f92759dca',
            },
            {
              key: 'code_id',
              value: '975',
            },
          ],
        },
      ],
    },
  ],
  height: 2_189_275,
  transactionHash: 'E2D591CADF02BF7318E1D4D5009F6D67E2E148216CE6AFCE79BB5395A16B2696',
  gasWanted: 1_199_279,
  gasUsed: 935_691,
};
