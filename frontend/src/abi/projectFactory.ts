export const projectFactoryAbi = [
  {
    type: 'function',
    name: 'createProject',
    stateMutability: 'nonpayable',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        components: [
          { name: 'projectId', type: 'bytes32' },
          { name: 'projectOwner', type: 'address' },
          { name: 'name', type: 'string' },
          { name: 'metadataUri', type: 'string' },
          { name: 'orgAddress', type: 'address' },
          { name: 'validateModel', type: 'uint8' },
          { name: 'contributionModel', type: 'uint8' },
          { name: 'validationStrategy', type: 'address' },
          { name: 'votingStrategy', type: 'address' },
          { name: 'treasuryAddress', type: 'address' },
          { name: 'admins', type: 'address[]' },
          { name: 'contributors', type: 'address[]' },
          { name: 'voters', type: 'address[]' },
          { name: 'tokenSymbol', type: 'string' },
        ],
      },
    ],
    outputs: [{ name: 'projectProxy', type: 'address' }],
  },
  {
    type: 'event',
    name: 'ProjectCreated',
    inputs: [
      { name: 'proxy', type: 'address', indexed: true },
      { name: 'implementation', type: 'address', indexed: true },
      { name: 'projectOwner', type: 'address', indexed: false },
      { name: 'creator', type: 'address', indexed: false },
      { name: 'name', type: 'string', indexed: false },
    ],
  },
] as const;
