import { hashTypedData, recoverTypedDataAddress, type Hex } from 'viem';

export type VoteChoiceValue = number;

export interface VoteTypedDataMessage extends Record<string, unknown> {
  projectId: Hex;
  contributionId: Hex;
  choice: VoteChoiceValue;
  voter: `0x${string}`;
  nonce: number;
}

export interface VoteTypedDataPayload {
  domain: {
    name: string;
    version: string;
    chainId: number;
    verifyingContract: `0x${string}`;
  };
  types: typeof VOTE_TYPED_DATA_TYPES;
  primaryType: 'Vote';
  message: VoteTypedDataMessage;
}

const VOTE_DOMAIN_NAME =
  process.env.NEXT_PUBLIC_VOTE_DOMAIN_NAME ?? 'Fairsharing Vote';
const VOTE_DOMAIN_VERSION =
  process.env.NEXT_PUBLIC_VOTE_DOMAIN_VERSION ?? '1';
const VOTE_CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 1);
const VOTE_CONTRACT_ADDRESS =
  (process.env.NEXT_PUBLIC_VOTE_CONTRACT_ADDRESS ??
    '0x0000000000000000000000000000000000000000') as `0x${string}`;

export const VOTE_TYPED_DATA_TYPES = {
  Vote: [
    { name: 'projectId', type: 'bytes32' },
    { name: 'contributionId', type: 'bytes32' },
    { name: 'voter', type: 'address' },
    { name: 'choice', type: 'uint8' },
    { name: 'nonce', type: 'uint256' },
  ],
} as const;

const getVoteDomain = ({
  chainId = VOTE_CHAIN_ID,
  verifyingContract = VOTE_CONTRACT_ADDRESS,
}: {
  chainId?: number;
  verifyingContract?: `0x${string}`;
} = {}) => ({
  name: VOTE_DOMAIN_NAME,
  version: VOTE_DOMAIN_VERSION,
  chainId,
  verifyingContract,
});

export const buildVoteTypedData = (
  message: VoteTypedDataMessage,
  options?: { chainId?: number; verifyingContract?: `0x${string}` },
): VoteTypedDataPayload => ({
  domain: getVoteDomain(options),
  types: VOTE_TYPED_DATA_TYPES,
  primaryType: 'Vote',
  message,
});

export const hashVoteTypedData = (
  message: VoteTypedDataMessage,
  options?: { chainId?: number; verifyingContract?: `0x${string}` },
) => {
  const typedData = buildVoteTypedData(message, options);
  // Cast to align with viem's MessageDefinition typing (nonce expects bigint)
  return hashTypedData(typedData as any);
};

export const recoverVoteSigner = async (
  message: VoteTypedDataMessage,
  signature: `0x${string}`,
  options?: { chainId?: number; verifyingContract?: `0x${string}` },
) => {
  const typedData = buildVoteTypedData(message, options);
  return recoverTypedDataAddress({
    ...(typedData as any),
    signature,
  });
};
