import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { protectedProcedure } from '../middleware';
import { db } from '@/lib/db';
import {
  VoteType,
  ProjectValidateType,
  MemberRole,
  ContributionStatus,
} from '@prisma/client';
import {
  buildVoteTypedData,
  hashVoteTypedData,
  recoverVoteSigner,
} from '@/lib/vote-signature';
import {
  getVoteChoiceValue,
  VOTE_CHOICES,
  type VoteChoice,
} from '@/types/vote';
import { publishContributionOnChain } from '../services/publishContributionOnChain';
import { evaluateVotingStrategy } from '../services/voteStrategy';

// Input validation schemas
const voteChoiceSchema = z.enum(VOTE_CHOICES);

const createVoteSchema = z.object({
  contributionId: z.string().cuid(),
  choice: voteChoiceSchema,
  signature: z.string().regex(/^0x[a-fA-F0-9]+$/, 'Invalid signature'),
  nonce: z.number().int().positive(),
});

const prepareVoteSchema = z.object({
  contributionId: z.string().cuid(),
  choice: voteChoiceSchema,
});

const getVotesSchema = z.object({
  contributionId: z.string().cuid(),
});

const getMyVotesSchema = z.object({
  projectId: z.string().cuid(),
});

// Apply voting strategy and check if contribution should change status
async function applyVotingStrategy(contributionId: string) {
  const contribution = await db.contribution.findUnique({
    where: { id: contributionId, deletedAt: null },
    include: {
      project: {
        include: {
          members: {
            where: { deletedAt: null },
            select: { role: true },
          },
        },
      },
      votes: {
        where: { deletedAt: null },
        select: { type: true, voterId: true },
      },
    },
  });

  if (!contribution || contribution.status !== ContributionStatus.VALIDATING) {
    return;
  }

  const project = contribution.project;
  const approvalStrategy = project.approvalStrategy as any;
  const strategyKey = approvalStrategy?.strategy || 'simple';
  const strategyConfig = approvalStrategy?.config ?? approvalStrategy;
  
  // Count eligible voters
  let eligibleVoters = 0;
  if (project.validateType === ProjectValidateType.SPECIFIC_MEMBERS) {
    eligibleVoters = project.members.filter(member =>
      member.role.includes(MemberRole.VALIDATOR)
    ).length;
  } else {
    eligibleVoters = project.members.length;
  }

  const strategyResult = evaluateVotingStrategy(strategyKey, {
    eligibleVoters,
    votes: contribution.votes.map(vote => ({
      type: vote.type,
      voterId: vote.voterId,
    })),
    config: strategyConfig,
  });

  // Update contribution status if determined
  if (strategyResult.statusDetermined) {
    const newStatus = strategyResult.shouldPass
      ? ContributionStatus.PASSED
      : ContributionStatus.FAILED;

    // Log voting result for debugging
    console.log(`Voting result for contribution ${contributionId}:`, {
      strategy: strategyKey,
      ...strategyResult.meta,
      eligibleVoters,
      newStatus,
      shouldPass: strategyResult.shouldPass,
      shouldFail: strategyResult.shouldFail,
    });
    
    await db.contribution.update({
      where: { id: contributionId },
      data: {
        status: newStatus,
        updatedAt: new Date(),
      },
    });

    if (strategyResult.shouldPass) {
      await publishContributionOnChain(contributionId);
    }
  }
}

// Helper function to check voting permissions
async function checkVotingPermissions(userId: string, contributionId: string) {
  const contribution = await db.contribution.findUnique({
    where: { id: contributionId, deletedAt: null },
    include: {
      project: {
        include: {
          members: {
            where: { deletedAt: null },
            include: { user: true },
          },
        },
      },
      contributors: {
        where: { deletedAt: null },
        select: { contributorId: true },
      },
    },
  });

  if (!contribution) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Contribution not found',
    });
  }

  // Check if contribution is still in validating status
  if (contribution.status !== ContributionStatus.VALIDATING) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Voting is no longer available for this contribution',
    });
  }

  // Check if user is trying to vote on their own contribution
  const isOwnContribution = contribution.contributors.some(
    c => c.contributorId === userId
  );
  
  const project = contribution.project;
  
  // Check if user is a validator (will be checked later in the validation permissions section)
  const isValidator = project.members.some(
    member => member.userId === userId && member.role.includes(MemberRole.VALIDATOR)
  );
  
  // Only allow own contribution voting if user is a validator
  if (isOwnContribution && !isValidator) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You cannot vote on your own contribution unless you are a validator',
    });
  }

  // Check validation permissions based on project settings
  if (project.validateType === ProjectValidateType.SPECIFIC_MEMBERS) {
    // Only members with VALIDATOR role can vote
    const userMember = project.members.find(member => member.userId === userId);
    if (!userMember || !userMember.role.includes(MemberRole.VALIDATOR)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to vote on this contribution',
      });
    }
  } else if (project.validateType === ProjectValidateType.ALL_MEMBERS) {
    // All project members can vote
    const isMember = project.members.some(member => member.userId === userId);
    if (!isMember) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Only project members can vote on contributions',
      });
    }
  }

  return contribution;
}

export const voteRouter = createTRPCRouter({
  prepareTypedData: protectedProcedure
    .input(prepareVoteSchema)
    .mutation(async ({ input, ctx }) => {
      const authUser = (ctx as any).user;

      if (!authUser) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be authenticated to vote',
        });
      }

      const contribution = await checkVotingPermissions(
        authUser.id,
        input.contributionId,
      );

      const existingVote = await db.vote.findUnique({
        where: {
          voterId_contributionId: {
            voterId: authUser.id,
            contributionId: input.contributionId,
          },
        },
      });

      const nonce = existingVote ? existingVote.nonce + 1 : 1;

      const message = {
        projectId: contribution.projectId,
        contributionId: input.contributionId,
        voter: authUser.walletAddress,
        choice: getVoteChoiceValue(input.choice as VoteChoice),
        nonce,
      };

      return buildVoteTypedData(message);
    }),

  // Create or update vote
  create: protectedProcedure
    .input(createVoteSchema)
    .mutation(async ({ input, ctx }) => {
      const authUser = (ctx as any).user;

      if (!authUser) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be authenticated to vote',
        });
      }

      const userId = authUser.id;
      const walletAddress = authUser.walletAddress;
      const signature = input.signature as `0x${string}`;

      try {
        // Check voting permissions
        const contribution = await checkVotingPermissions(
          userId,
          input.contributionId,
        );

        // Check if user has already voted
        const existingVote = await db.vote.findUnique({
          where: {
            voterId_contributionId: {
              voterId: userId,
              contributionId: input.contributionId,
            },
          },
        });

        const expectedNonce = existingVote ? existingVote.nonce + 1 : 1;

        if (input.nonce !== expectedNonce) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid nonce for vote submission',
          });
        }

        const message = {
          projectId: contribution.projectId,
          contributionId: input.contributionId,
          voter: walletAddress,
          choice: getVoteChoiceValue(input.choice as VoteChoice),
          nonce: input.nonce,
        };

        const recoveredSigner = await recoverVoteSigner(message, signature);

        if (recoveredSigner.toLowerCase() !== walletAddress.toLowerCase()) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Signature does not match connected wallet',
          });
        }

        const typedDataHash = hashVoteTypedData(message);

        let result;

        if (existingVote) {
          result = await db.vote.update({
            where: { id: existingVote.id },
            data: {
              type: input.choice as VoteType,
              signature,
              nonce: input.nonce,
              typedDataHash,
              deletedAt: null,
              updatedAt: new Date(),
            },
          });
        } else {
          result = await db.vote.create({
            data: {
              type: input.choice as VoteType,
              voterId: userId,
              contributionId: input.contributionId,
              signature,
              nonce: input.nonce,
              typedDataHash,
            },
          });
        }

        // Apply voting strategy to check if contribution status should change
        await applyVotingStrategy(input.contributionId);

        return {
          success: true,
          vote: result,
          message: 'Vote submitted successfully',
        };
      } catch (error) {
        console.error('Error creating vote:', error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to submit vote',
        });
      }
    }),

  // Get votes for a specific contribution
  get: publicProcedure
    .input(getVotesSchema)
    .query(async ({ input }) => {
      const votes = await db.vote.findMany({
        where: {
          contributionId: input.contributionId,
          deletedAt: null,
        },
        include: {
          voter: {
            select: {
              id: true,
              walletAddress: true,
              ensName: true,
              name: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Count votes by type
      const voteCounts = {
        PASS: votes.filter(v => v.type === VoteType.PASS).length,
        FAIL: votes.filter(v => v.type === VoteType.FAIL).length,
        SKIP: votes.filter(v => v.type === VoteType.SKIP).length,
      };

      return {
        votes,
        counts: voteCounts,
        total: votes.length,
      };
    }),

  // Get current user's votes for a project
  getMyVotes: protectedProcedure
    .input(getMyVotesSchema)
    .query(async ({ input, ctx }) => {
      const userId = (ctx as any).user?.id;

      const votes = await db.vote.findMany({
        where: {
          voterId: userId,
          deletedAt: null,
          contribution: {
            projectId: input.projectId,
            deletedAt: null,
          },
        },
        include: {
          contribution: {
            select: {
              id: true,
              content: true,
              status: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return votes;
    }),

  // Delete vote (soft delete)
  delete: protectedProcedure
    .input(z.object({ contributionId: z.string().cuid() }))
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx as any).user?.id;

      try {
        // Find existing vote
        const existingVote = await db.vote.findUnique({
          where: {
            voterId_contributionId: {
              voterId: userId,
              contributionId: input.contributionId,
            },
          },
        });

        if (!existingVote || existingVote.deletedAt) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Vote not found',
          });
        }

        // Check if contribution is still in validating status
        const contribution = await db.contribution.findUnique({
          where: { id: input.contributionId, deletedAt: null },
          select: { status: true },
        });

        if (!contribution || contribution.status !== ContributionStatus.VALIDATING) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Cannot remove vote from a finalized contribution',
          });
        }

        // Soft delete vote
        await db.vote.update({
          where: { id: existingVote.id },
          data: { deletedAt: new Date() },
        });

        // Apply voting strategy to check if contribution status should change
        await applyVotingStrategy(input.contributionId);

        return {
          success: true,
          message: 'Vote removed successfully',
        };
      } catch (error) {
        console.error('Error deleting vote:', error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to remove vote',
        });
      }
    }),

  // Get voting statistics for a contribution
  getStats: publicProcedure
    .input(getVotesSchema)
    .query(async ({ input }) => {
      const contribution = await db.contribution.findUnique({
        where: { id: input.contributionId, deletedAt: null },
        include: {
          project: {
            include: {
              members: {
                where: { deletedAt: null },
                select: { role: true },
              },
            },
          },
          votes: {
            where: { deletedAt: null },
            select: { type: true },
          },
        },
      });

      if (!contribution) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Contribution not found',
        });
      }

      // Count eligible voters based on project settings
      let eligibleVoters = 0;
      if (contribution.project.validateType === ProjectValidateType.SPECIFIC_MEMBERS) {
        eligibleVoters = contribution.project.members.filter(member =>
          member.role.includes(MemberRole.VALIDATOR)
        ).length;
      } else {
        eligibleVoters = contribution.project.members.length;
      }

      // Count votes by type
      const voteCounts = {
        PASS: contribution.votes.filter(v => v.type === VoteType.PASS).length,
        FAIL: contribution.votes.filter(v => v.type === VoteType.FAIL).length,
        SKIP: contribution.votes.filter(v => v.type === VoteType.SKIP).length,
      };

      const totalVotes = voteCounts.PASS + voteCounts.FAIL + voteCounts.SKIP;
      const votingParticipation = eligibleVoters > 0 ? (totalVotes / eligibleVoters) * 100 : 0;

      return {
        eligibleVoters,
        totalVotes,
        votingParticipation: Math.round(votingParticipation * 100) / 100,
        counts: voteCounts,
        percentages: {
          PASS: totalVotes > 0 ? Math.round((voteCounts.PASS / totalVotes) * 100) : 0,
          FAIL: totalVotes > 0 ? Math.round((voteCounts.FAIL / totalVotes) * 100) : 0,
          SKIP: totalVotes > 0 ? Math.round((voteCounts.SKIP / totalVotes) * 100) : 0,
        },
      };
    }),
});
