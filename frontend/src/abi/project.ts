export const projectAbi = [
  {
    type: 'function',
    name: 'updateSettings',
    stateMutability: 'nonpayable',
    inputs: [
      {
        name: 'settings',
        type: 'tuple',
        components: [
          { name: 'metadataUri', type: 'string' },
          { name: 'validateModel', type: 'uint8' },
          { name: 'contributionModel', type: 'uint8' },
          {
            name: 'roles',
            type: 'tuple',
            components: [
              { name: 'addAdmins', type: 'address[]' },
              { name: 'removeAdmins', type: 'address[]' },
              { name: 'addContributors', type: 'address[]' },
              { name: 'removeContributors', type: 'address[]' },
              { name: 'addVoters', type: 'address[]' },
              { name: 'removeVoters', type: 'address[]' },
            ],
          },
        ],
      },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'submitContribution',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'projectId_', type: 'bytes32' },
      { name: 'contributionId', type: 'bytes32' },
      { name: 'contributionHash', type: 'bytes32' },
      {
        name: 'votes',
        type: 'tuple[]',
        components: [
          { name: 'voter', type: 'address' },
          { name: 'choice', type: 'uint8' },
          { name: 'nonce', type: 'uint256' },
          { name: 'signature', type: 'bytes' },
        ],
      },
      { name: 'strategyData', type: 'bytes' },
      { name: 'rewardRecipient', type: 'address' },
      { name: 'rewardAmount', type: 'uint256' },
      { name: 'rawContributionJson', type: 'string' },
    ],
    outputs: [],
  },
] as const;
