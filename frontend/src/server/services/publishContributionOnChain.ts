import { db } from '@/lib/db';
import { getVoteChoiceValue, type VoteChoice } from '@/types/vote';
import { keccak256, stringToHex, type Hex } from 'viem';
import { ContributionStatus } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { ensureContributionBytes32, ensureProjectBytes32 } from './idMapping';

type SerializableDate = string | null;

interface VoteRecordPayload {
  voter: string;
  choice: number;
  nonce: number;
  signature: string;
}

interface ContributionSnapshot {
  content: string;
  hours: number | null;
  tags: string[];
  startAt: SerializableDate;
  endAt: SerializableDate;
  contributorAddress: string;
  points: number | null;
}

export interface OnChainPublishPayload {
  project: {
    id: string;
    projectIdBytes32: Hex;
    onChainAddress: `0x${string}`;
  };
  contribution: {
    id: string;
    contributionIdBytes32: Hex;
  };
  contributionHash: Hex;
  rawContribution: ContributionSnapshot;
  votes: VoteRecordPayload[];
  rewardAmount: string;
  rewardRecipient: string;
}

export interface BuiltContributionPayload {
  payload: OnChainPublishPayload;
  payloadDigest: Hex;
}

const normalizeDate = (value: Date | null) => value?.toISOString() ?? null;

const voteTypeToChoiceValue = (type: VoteChoice) => getVoteChoiceValue(type);

export const buildContributionOnChainPayload = async (
  contributionId: string,
): Promise<BuiltContributionPayload> => {
  const contribution = await db.contribution.findUnique({
    where: { id: contributionId, deletedAt: null },
    include: {
      project: {
        select: {
          id: true,
          projectIdBytes32: true,
          onChainAddress: true,
        },
      },
      contributors: {
        where: { deletedAt: null },
        include: {
          contributor: {
            select: {
              id: true,
              walletAddress: true,
            },
          },
        },
      },
      votes: {
        where: { deletedAt: null },
        include: {
          voter: {
            select: {
              id: true,
              walletAddress: true,
            },
          },
        },
      },
    },
  });

  if (!contribution) {
    throw new Error('Contribution not found for on-chain publication');
  }

  if (!contribution.project.onChainAddress) {
    throw new Error('Project is missing on-chain address configuration');
  }

  const projectIdBytes32 = await ensureProjectBytes32(
    contribution.project.id,
    contribution.project.projectIdBytes32,
  );
  const contributionIdBytes32 = await ensureContributionBytes32(
    contribution.id,
    contribution.contributionIdBytes32,
  );

  const primaryEntry = contribution.contributors[0];
  const primaryContributorAddress = primaryEntry?.contributor.walletAddress;

  if (!primaryContributorAddress) {
    throw new Error('Contribution is missing contributor wallet address');
  }

  const snapshot: ContributionSnapshot = {
    content: contribution.content,
    hours: contribution.hours ?? null,
    tags: contribution.tags,
    startAt: normalizeDate(contribution.startAt ?? null),
    endAt: normalizeDate(contribution.endAt ?? null),
    contributorAddress: primaryContributorAddress,
    points: primaryEntry?.points ?? null,
  };

  const snapshotString = JSON.stringify(snapshot);
  const contributionHash = keccak256(stringToHex(snapshotString));

  const votes: VoteRecordPayload[] = contribution.votes
    .filter((vote) => Boolean(vote.signature) && vote.nonce > 0)
    .map((vote) => ({
      voter: vote.voter.walletAddress,
      choice: voteTypeToChoiceValue(vote.type as VoteChoice),
      nonce: vote.nonce,
      signature: vote.signature as string,
    }));

  const rewardAmount = contribution.contributors.reduce<bigint>((total, entry) => {
    const points = entry.points ?? 0;
    return total + BigInt(points);
  }, BigInt(0));
  const rewardRecipient = primaryContributorAddress;

  const payload: OnChainPublishPayload = {
    project: {
      id: contribution.projectId,
      projectIdBytes32,
      onChainAddress: contribution.project.onChainAddress as `0x${string}`,
    },
    contribution: {
      id: contribution.id,
      contributionIdBytes32,
    },
    contributionHash,
    rawContribution: snapshot,
    votes,
    rewardAmount: rewardAmount.toString(),
    rewardRecipient,
  };

  const payloadDigest = keccak256(stringToHex(JSON.stringify(payload)));

  return { payload, payloadDigest };
};

export const commitContributionOnChain = async (
  contributionId: string,
  txHash?: string | null,
) => {
  const contribution = await db.contribution.findUnique({
    where: { id: contributionId, deletedAt: null },
    select: {
      id: true,
      status: true,
      onChainPayload: true,
      onChainPublishedAt: true,
    },
  });

  if (!contribution) {
    throw new Error('Contribution not found for on-chain publication');
  }

  if (contribution.onChainPublishedAt && contribution.onChainPayload) {
    return contribution.onChainPayload;
  }

  if (contribution.status !== ContributionStatus.PASSED) {
    throw new Error('Contribution must be in PASSED status before publishing on-chain');
  }

  const { payload } = await buildContributionOnChainPayload(contributionId);

  await db.contribution.update({
    where: { id: contributionId },
    data: {
      status: ContributionStatus.ON_CHAIN,
      contributionHash: payload.contributionHash,
      onChainSnapshot: payload.rawContribution as unknown as Prisma.InputJsonValue,
      onChainPayload: payload as unknown as Prisma.InputJsonValue,
      onChainPublishedAt: new Date(),
      onChainTxHash: txHash ?? null,
    },
  });

  return payload;
};
