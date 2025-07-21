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

// Input validation schemas
const createVoteSchema = z.object({
  contributionId: z.string().cuid(),
  type: z.enum(['PASS', 'FAIL', 'SKIP']),
});

const updateVoteSchema = z.object({
  contributionId: z.string().cuid(),
  type: z.enum(['PASS', 'FAIL', 'SKIP']),
});

const getVotesSchema = z.object({
  contributionId: z.string().cuid(),
});

const getMyVotesSchema = z.object({
  projectId: z.string().cuid(),
});

// Interface for future blockchain integration
interface BlockchainVotingService {
  submitVotingResult(contributionId: string, passed: boolean, votes: any): Promise<string>;
  getVotingStatus(contributionId: string): Promise<any>;
}

// Placeholder for blockchain service - will be implemented later
const blockchainService: BlockchainVotingService | null = null;

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
  const strategy = approvalStrategy?.strategy || 'simple';
  
  // Count eligible voters
  let eligibleVoters = 0;
  if (project.validateType === ProjectValidateType.SPECIFIC_MEMBERS) {
    eligibleVoters = project.members.filter(member =>
      member.role.includes(MemberRole.VALIDATOR)
    ).length;
  } else {
    eligibleVoters = project.members.length;
  }

  // Count votes
  const passVotes = contribution.votes.filter(v => v.type === VoteType.PASS).length;
  const failVotes = contribution.votes.filter(v => v.type === VoteType.FAIL).length;
  const skipVotes = contribution.votes.filter(v => v.type === VoteType.SKIP).length;
  const totalVotes = passVotes + failVotes + skipVotes;

  let shouldPass = false;
  let shouldFail = false;
  let statusDetermined = false;

  // Apply different voting strategies
  switch (strategy) {
    case 'simple': 
      // Simple Majority: If more than 50% of the votes go to "Approve" (PASS)
      const nonSkipVotes = totalVotes - skipVotes;
      if (nonSkipVotes > 0) {
        shouldPass = passVotes > nonSkipVotes / 2;
        shouldFail = failVotes > nonSkipVotes / 2;
        statusDetermined = shouldPass || shouldFail;
      }
      break;

    case 'quorum': 
      // Quorum + Majority: Currently disabled in frontend
      // Future implementation would require quorum + majority logic
      break;

    case 'absolute': 
      // Absolute Threshold: Currently disabled in frontend
      // Future implementation would require fixed number/percentage threshold
      break;

    case 'relative': 
      // Relative Majority: Currently disabled in frontend
      // Future implementation would be whoever has most votes wins
      break;

    default:
      // Fallback to simple majority for unknown strategies
      const defaultNonSkipVotes = totalVotes - skipVotes;
      if (defaultNonSkipVotes > 0) {
        shouldPass = passVotes > defaultNonSkipVotes / 2;
        shouldFail = failVotes > defaultNonSkipVotes / 2;
        statusDetermined = shouldPass || shouldFail;
      }
      break;
  }

  // Update contribution status if determined
  if (statusDetermined) {
    const newStatus = shouldPass ? ContributionStatus.PASSED : ContributionStatus.FAILED;
    
    // Log voting result for debugging
    console.log(`Voting result for contribution ${contributionId}:`, {
      strategy,
      passVotes,
      failVotes,
      skipVotes,
      totalVotes,
      eligibleVoters,
      newStatus,
      shouldPass,
      shouldFail,
    });
    
    await db.contribution.update({
      where: { id: contributionId },
      data: {
        status: newStatus,
        updatedAt: new Date(),
      },
    });

    // Prepare for future blockchain integration
    if (blockchainService) {
      // This will be implemented when blockchain integration is ready
      // await blockchainService.submitVotingResult(contributionId, shouldPass, {
      //   passVotes,
      //   failVotes,
      //   skipVotes,
      //   totalVotes,
      //   eligibleVoters,
      // });
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
  // Create or update vote
  create: protectedProcedure
    .input(createVoteSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx as any).user?.id;

      try {
        // Check voting permissions
        await checkVotingPermissions(userId, input.contributionId);

        // Check if user has already voted
        const existingVote = await db.vote.findUnique({
          where: {
            voterId_contributionId: {
              voterId: userId,
              contributionId: input.contributionId,
            },
          },
        });

        let result;

        if (existingVote) {
          if (existingVote.deletedAt) {
            // Restore soft-deleted vote with new type
            result = await db.vote.update({
              where: { id: existingVote.id },
              data: {
                type: input.type as VoteType,
                deletedAt: null,
                updatedAt: new Date(),
              },
            });
          } else {
            // Update existing vote
            result = await db.vote.update({
              where: { id: existingVote.id },
              data: {
                type: input.type as VoteType,
                updatedAt: new Date(),
              },
            });
          }
        } else {
          // Create new vote
          result = await db.vote.create({
            data: {
              type: input.type as VoteType,
              voterId: userId,
              contributionId: input.contributionId,
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

  // Update existing vote
  update: protectedProcedure
    .input(updateVoteSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx as any).user?.id;

      try {
        // Check voting permissions
        await checkVotingPermissions(userId, input.contributionId);

        // Check if vote exists
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

        // Update vote
        const result = await db.vote.update({
          where: { id: existingVote.id },
          data: {
            type: input.type as VoteType,
            updatedAt: new Date(),
          },
        });

        return {
          success: true,
          vote: result,
          message: 'Vote updated successfully',
        };
      } catch (error) {
        console.error('Error updating vote:', error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update vote',
        });
      }
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