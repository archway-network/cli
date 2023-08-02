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
  gasWanted: 1_199_279,
  gasUsed: 935_691,
};

export const dummyInstantiateTransaction = {
  contractAddress: 'archway1l3n05jjyrku0my3ahyg66q95jvstpjnn2xfkyw9xemz5zvl5rssqmnlr0q',
  logs: [
    {
      msg_index: 0,
      log: '',
      events: [
        {
          type: 'instantiate',
          attributes: [
            {
              key: '_contract_address',
              value: 'archway1l3n05jjyrku0my3ahyg66q95jvstpjnn2xfkyw9xemz5zvl5rssqmnlr0q',
            },
            {
              key: 'code_id',
              value: '100',
            },
          ],
        },
        {
          type: 'message',
          attributes: [
            {
              key: 'action',
              value: '/cosmwasm.wasm.v1.MsgInstantiateContract',
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
          type: 'wasm',
          attributes: [
            {
              key: '_contract_address',
              value: 'archway1l3n05jjyrku0my3ahyg66q95jvstpjnn2xfkyw9xemz5zvl5rssqmnlr0q',
            },
            {
              key: 'method',
              value: 'instantiate',
            },
            {
              key: 'owner',
              value: 'archway1w8uad5ddvadfv3vdjrt3d8f3famnrg4msd43zv',
            },
          ],
        },
      ],
    },
  ],
  height: 271_471,
  transactionHash: '49183004474DF2ED15B92663F5FDB0766C9C0608E0EA0944F2B1166F0BC59DA5',
  events: [
    {
      type: 'coin_spent',
      attributes: [
        {
          key: 'spender',
          value: 'archway1w8uad5ddvadfv3vdjrt3d8f3famnrg4msd43zv',
        },
        {
          key: 'amount',
          value: '197258400000000000aconst',
        },
      ],
    },
    {
      type: 'coin_received',
      attributes: [
        {
          key: 'receiver',
          value: 'archway17xpfvakm2amg962yls6f84z3kell8c5l9jlyp2',
        },
        {
          key: 'amount',
          value: '197258400000000000aconst',
        },
      ],
    },
    {
      type: 'transfer',
      attributes: [
        {
          key: 'recipient',
          value: 'archway17xpfvakm2amg962yls6f84z3kell8c5l9jlyp2',
        },
        {
          key: 'sender',
          value: 'archway1w8uad5ddvadfv3vdjrt3d8f3famnrg4msd43zv',
        },
        {
          key: 'amount',
          value: '197258400000000000aconst',
        },
      ],
    },
    {
      type: 'message',
      attributes: [
        {
          key: 'sender',
          value: 'archway1w8uad5ddvadfv3vdjrt3d8f3famnrg4msd43zv',
        },
      ],
    },
    {
      type: 'tx',
      attributes: [
        {
          key: 'fee',
          value: '197258400000000000aconst',
        },
      ],
    },
    {
      type: 'tx',
      attributes: [
        {
          key: 'acc_seq',
          value: 'archway1w8uad5ddvadfv3vdjrt3d8f3famnrg4msd43zv/7',
        },
      ],
    },
    {
      type: 'tx',
      attributes: [
        {
          key: 'signature',
          value: 'LLQ9K/x3jq3l+KoKluwaFYFj0p+dAb8M5nH3KAJSHC48Z7/BzFKNgTD6D8RHtbS7iZ1l6yCl9+nev2KlscUHRA==',
        },
      ],
    },
    {
      type: 'message',
      attributes: [
        {
          key: 'action',
          value: '/cosmwasm.wasm.v1.MsgInstantiateContract',
        },
      ],
    },
    {
      type: 'message',
      attributes: [
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
      type: 'instantiate',
      attributes: [
        {
          key: '_contract_address',
          value: 'archway1l3n05jjyrku0my3ahyg66q95jvstpjnn2xfkyw9xemz5zvl5rssqmnlr0q',
        },
        {
          key: 'code_id',
          value: '100',
        },
      ],
    },
    {
      type: 'wasm',
      attributes: [
        {
          key: '_contract_address',
          value: 'archway1l3n05jjyrku0my3ahyg66q95jvstpjnn2xfkyw9xemz5zvl5rssqmnlr0q',
        },
        {
          key: 'method',
          value: 'instantiate',
        },
        {
          key: 'owner',
          value: 'archway1w8uad5ddvadfv3vdjrt3d8f3famnrg4msd43zv',
        },
      ],
    },
  ],
  gasWanted: 219_176,
  gasUsed: 184_007,
};

export const dummyMetadataTransaction = {
  logs: [
    {
      msg_index: 0,
      log: '',
      events: [
        {
          type: 'archway.rewards.v1.ContractMetadataSetEvent',
          attributes: [
            {
              key: 'contract_address',
              value: '"archway1l3n05jjyrku0my3ahyg66q95jvstpjnn2xfkyw9xemz5zvl5rssqmnlr0q"',
            },
            {
              key: 'metadata',
              value:
                '{"contract_address":"archway1l3n05jjyrku0my3ahyg66q95jvstpjnn2xfkyw9xemz5zvl5rssqmnlr0q","owner_address":"archway1w8uad5ddvadfv3vdjrt3d8f3famnrg4msd43zv","rewards_address":""}',
            },
          ],
        },
        {
          type: 'message',
          attributes: [
            {
              key: 'action',
              value: '/archway.rewards.v1.MsgSetContractMetadata',
            },
          ],
        },
      ],
    },
  ],
  height: 271_847,
  transactionHash: '94C10853F3E3685456409C88F238650EDD62DF88F330907CE67BB33DC3E0D545',
  events: [
    {
      type: 'coin_spent',
      attributes: [
        {
          key: 'spender',
          value: 'archway1w8uad5ddvadfv3vdjrt3d8f3famnrg4msd43zv',
        },
        {
          key: 'amount',
          value: '74738700000000000aconst',
        },
      ],
    },
    {
      type: 'coin_received',
      attributes: [
        {
          key: 'receiver',
          value: 'archway17xpfvakm2amg962yls6f84z3kell8c5l9jlyp2',
        },
        {
          key: 'amount',
          value: '74738700000000000aconst',
        },
      ],
    },
    {
      type: 'transfer',
      attributes: [
        {
          key: 'recipient',
          value: 'archway17xpfvakm2amg962yls6f84z3kell8c5l9jlyp2',
        },
        {
          key: 'sender',
          value: 'archway1w8uad5ddvadfv3vdjrt3d8f3famnrg4msd43zv',
        },
        {
          key: 'amount',
          value: '74738700000000000aconst',
        },
      ],
    },
    {
      type: 'message',
      attributes: [
        {
          key: 'sender',
          value: 'archway1w8uad5ddvadfv3vdjrt3d8f3famnrg4msd43zv',
        },
      ],
    },
    {
      type: 'tx',
      attributes: [
        {
          key: 'fee',
          value: '74738700000000000aconst',
        },
      ],
    },
    {
      type: 'tx',
      attributes: [
        {
          key: 'acc_seq',
          value: 'archway1w8uad5ddvadfv3vdjrt3d8f3famnrg4msd43zv/8',
        },
      ],
    },
    {
      type: 'tx',
      attributes: [
        {
          key: 'signature',
          value: 'z8iCF63ggvs+cNrhCTnLxF9ilFFLW6NF/QCp4UZPgr8R/g5qwGxky0Ieq2GvksHnq9aDyIGCKgCE/nwRTCheLw==',
        },
      ],
    },
    {
      type: 'message',
      attributes: [
        {
          key: 'action',
          value: '/archway.rewards.v1.MsgSetContractMetadata',
        },
      ],
    },
    {
      type: 'archway.rewards.v1.ContractMetadataSetEvent',
      attributes: [
        {
          key: 'contract_address',
          value: '"archway1l3n05jjyrku0my3ahyg66q95jvstpjnn2xfkyw9xemz5zvl5rssqmnlr0q"',
        },
        {
          key: 'metadata',
          value:
            '{"contract_address":"archway1l3n05jjyrku0my3ahyg66q95jvstpjnn2xfkyw9xemz5zvl5rssqmnlr0q","owner_address":"archway1w8uad5ddvadfv3vdjrt3d8f3famnrg4msd43zv","rewards_address":""}',
        },
      ],
    },
  ],
  gasWanted: 83_043,
  gasUsed: 79_249,
  metadata: {
    contractAddress: 'archway1l3n05jjyrku0my3ahyg66q95jvstpjnn2xfkyw9xemz5zvl5rssqmnlr0q',
    ownerAddress: 'archway1w8uad5ddvadfv3vdjrt3d8f3famnrg4msd43zv',
    rewardsAddress: '',
  },
};

export const dummyPremiumTransaction = {
  logs: [
    {
      msg_index: 0,
      log: '',
      events: [
        {
          type: 'archway.rewards.v1.ContractFlatFeeSetEvent',
          attributes: [
            {
              key: 'contract_address',
              value: '"archway1l3n05jjyrku0my3ahyg66q95jvstpjnn2xfkyw9xemz5zvl5rssqmnlr0q"',
            },
            {
              key: 'flat_fee',
              value: '{"denom":"aconst","amount":"2"}',
            },
          ],
        },
        {
          type: 'message',
          attributes: [
            {
              key: 'action',
              value: '/archway.rewards.v1.MsgSetFlatFee',
            },
          ],
        },
      ],
    },
  ],
  height: 271_962,
  transactionHash: '390DD4050068EFBCF719BD35B0516BFA89DF526E6C94D624191B1A7E8B7BA43E',
  events: [
    {
      type: 'coin_spent',
      attributes: [
        {
          key: 'spender',
          value: 'archway1w8uad5ddvadfv3vdjrt3d8f3famnrg4msd43zv',
        },
        {
          key: 'amount',
          value: '69805800000000000aconst',
        },
      ],
    },
    {
      type: 'coin_received',
      attributes: [
        {
          key: 'receiver',
          value: 'archway17xpfvakm2amg962yls6f84z3kell8c5l9jlyp2',
        },
        {
          key: 'amount',
          value: '69805800000000000aconst',
        },
      ],
    },
    {
      type: 'transfer',
      attributes: [
        {
          key: 'recipient',
          value: 'archway17xpfvakm2amg962yls6f84z3kell8c5l9jlyp2',
        },
        {
          key: 'sender',
          value: 'archway1w8uad5ddvadfv3vdjrt3d8f3famnrg4msd43zv',
        },
        {
          key: 'amount',
          value: '69805800000000000aconst',
        },
      ],
    },
    {
      type: 'message',
      attributes: [
        {
          key: 'sender',
          value: 'archway1w8uad5ddvadfv3vdjrt3d8f3famnrg4msd43zv',
        },
      ],
    },
    {
      type: 'tx',
      attributes: [
        {
          key: 'fee',
          value: '69805800000000000aconst',
        },
      ],
    },
    {
      type: 'tx',
      attributes: [
        {
          key: 'acc_seq',
          value: 'archway1w8uad5ddvadfv3vdjrt3d8f3famnrg4msd43zv/9',
        },
      ],
    },
    {
      type: 'tx',
      attributes: [
        {
          key: 'signature',
          value: 'soyyIzk1RhDSinjQClNjVznw3Tsb0jJJ7T32/95yfYx7uP/3iGj+CfoGZZX98NXqsBQJ/ErhDNJiEnVYzqggcw==',
        },
      ],
    },
    {
      type: 'message',
      attributes: [
        {
          key: 'action',
          value: '/archway.rewards.v1.MsgSetFlatFee',
        },
      ],
    },
    {
      type: 'archway.rewards.v1.ContractFlatFeeSetEvent',
      attributes: [
        {
          key: 'contract_address',
          value: '"archway1l3n05jjyrku0my3ahyg66q95jvstpjnn2xfkyw9xemz5zvl5rssqmnlr0q"',
        },
        {
          key: 'flat_fee',
          value: '{"denom":"aconst","amount":"2"}',
        },
      ],
    },
  ],
  gasWanted: 77_562,
  gasUsed: 75_033,
  premium: {
    contractAddress: 'archway1l3n05jjyrku0my3ahyg66q95jvstpjnn2xfkyw9xemz5zvl5rssqmnlr0q',
    flatFee: {
      denom: 'aconst',
      amount: '2',
    },
  },
};

export const dummyExecuteTransaction = {
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
              value: '/cosmwasm.wasm.v1.MsgExecuteContract',
            },
          ],
        },
      ],
    },
  ],
  height: 271_962,
  transactionHash: '390DD4050068EFBCF719BD35B0516BFA89DF526E6C94D624191B1A7E8B7BADEF',
  events: [
    {
      type: 'message',
      attributes: [
        {
          key: 'action',
          value: '/cosmwasm.wasm.v1.MsgExecuteContract',
        },
      ],
    },
  ],
  gasWanted: 77_562,
  gasUsed: 75_033,
};

export const dummyMigrateTransaction = {
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
              value: '/cosmwasm.wasm.v1.MsgMigrateContract',
            },
          ],
        },
      ],
    },
  ],
  height: 271_962,
  transactionHash: '390DD4050068EFBCF719BD35B0516BFA89DF526E6C94D624191B1A7E8B7BADEF',
  events: [
    {
      type: 'message',
      attributes: [
        {
          key: 'action',
          value: '/cosmwasm.wasm.v1.MsgMigrateContract',
        },
      ],
    },
  ],
  gasWanted: 77_562,
  gasUsed: 75_033,
};

export const dummyQueryResult = {
  msg: 'Hello, Archway!',
};

export const dummyRewardsQueryResult = {
  rewardsAddress: 'archway1l3n05jjyrku0my3ahyg66q95jvstpjnn2xfkyw9xemz5zvl5rssqmnlr0q',
  totalRewards: [{ denom: 'aconst', amount: '2' }],
  totalRecords: 1,
};
