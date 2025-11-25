import { hashTypedData, recoverTypedDataAddress } from 'viem';

export type VoteChoiceValue = number;

export interface VoteTypedDataMessage {
  projectId: string;
  contributionId: string;
  choice: VoteChoiceValue;
  voter: string;
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
    { name: 'projectId', type: 'string' },
    { name: 'contributionId', type: 'string' },
    { name: 'voter', type: 'address' },
    { name: 'choice', type: 'uint8' },
    { name: 'nonce', type: 'uint256' },
  ],
} as const;

const getVoteDomain = (chainId?: number) => ({
  name: VOTE_DOMAIN_NAME,
  version: VOTE_DOMAIN_VERSION,
  chainId: chainId ?? VOTE_CHAIN_ID,
  verifyingContract: VOTE_CONTRACT_ADDRESS,
});

export const buildVoteTypedData = (
  message: VoteTypedDataMessage,
  chainId?: number,
): VoteTypedDataPayload => ({
  domain: getVoteDomain(chainId),
  types: VOTE_TYPED_DATA_TYPES,
  primaryType: 'Vote',
  message,
});

export const hashVoteTypedData = (
  message: VoteTypedDataMessage,
  chainId?: number,
) => {
  const typedData = buildVoteTypedData(message, chainId);
  return hashTypedData(typedData);
};

export const recoverVoteSigner = async (
  message: VoteTypedDataMessage,
  signature: `0x${string}`,
  chainId?: number,
) => {
  const typedData = buildVoteTypedData(message, chainId);
  return recoverTypedDataAddress({
    ...typedData,
    signature,
  });
};
