import { db } from '@/lib/db';
import { getVoteChoiceValue, type VoteChoice } from '@/types/vote';
import { keccak256, stringToHex } from 'viem';
import { ContributionStatus } from '@prisma/client';
import type { Prisma } from '@prisma/client';

type SerializableDate = string | null;

interface VoteRecordPayload {
  projectId: string;
  contributionId: string;
  voter: string;
  choice: number;
  nonce: number;
  signature: string;
}

interface ContributionSnapshot {
  projectId: string;
  contributionId: string;
  content: string;
  hours: number | null;
  tags: string[];
  startAt: SerializableDate;
  endAt: SerializableDate;
  createdAt: string;
  updatedAt: string;
  contributors: Array<{
    contributorId: string;
    walletAddress: string;
    hours: number | null;
    points: number | null;
  }>;
}

export interface OnChainPublishPayload {
  projectId: string;
  contributionId: string;
  contributionHash: string;
  rawContribution: ContributionSnapshot;
  votes: VoteRecordPayload[];
}

const normalizeDate = (value: Date | null) => value?.toISOString() ?? null;

const voteTypeToChoiceValue = (type: VoteChoice) => getVoteChoiceValue(type);

export const publishContributionOnChain = async (contributionId: string) => {
  const contribution = await db.contribution.findUnique({
    where: { id: contributionId, deletedAt: null },
    include: {
      project: { select: { id: true } },
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

  if (contribution.onChainPublishedAt) {
    return contribution.onChainPayload;
  }

  const snapshot: ContributionSnapshot = {
    projectId: contribution.projectId,
    contributionId: contribution.id,
    content: contribution.content,
    hours: contribution.hours ?? null,
    tags: contribution.tags,
    startAt: normalizeDate(contribution.startAt ?? null),
    endAt: normalizeDate(contribution.endAt ?? null),
    createdAt: contribution.createdAt.toISOString(),
    updatedAt: contribution.updatedAt.toISOString(),
    contributors: contribution.contributors.map((entry) => ({
      contributorId: entry.contributorId,
      walletAddress: entry.contributor.walletAddress,
      hours: entry.hours ?? null,
      points: entry.points ?? null,
    })),
  };

  const snapshotString = JSON.stringify(snapshot);
  const snapshotHex = stringToHex(snapshotString);
  const contributionHash = keccak256(snapshotHex);

  const votes: VoteRecordPayload[] = contribution.votes
    .filter((vote) => Boolean(vote.signature) && vote.nonce > 0)
    .map((vote) => ({
      projectId: contribution.projectId,
      contributionId: contribution.id,
      voter: vote.voter.walletAddress,
      choice: voteTypeToChoiceValue(vote.type as VoteChoice),
      nonce: vote.nonce,
      signature: vote.signature as string,
    }));

  const payload: OnChainPublishPayload = {
    projectId: contribution.projectId,
    contributionId: contribution.id,
    contributionHash,
    rawContribution: snapshot,
    votes,
  };

  console.log(
    'publishContributionOnChain',
    JSON.stringify(payload, null, 2),
  );

  await db.contribution.update({
    where: { id: contribution.id },
    data: {
      status: ContributionStatus.ON_CHAIN,
      contributionHash,
      onChainSnapshot: snapshot as Prisma.InputJsonValue,
      onChainPayload: payload as Prisma.InputJsonValue,
      onChainPublishedAt: new Date(),
    },
  });

  return payload;
};
