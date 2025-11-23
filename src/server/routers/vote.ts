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
import { verifyEIP712Signature, normalizeAddress } from '@/lib/signatureVerification';
import { getVoteTypeEnum } from '@/lib/eip712';
import type { Address } from 'viem';

// Input validation schemas
const voteMessageSchema = z.object({
  contributionId: z.string(),
  projectId: z.string(),
  voteType: z.number().min(1).max(3),
  voter: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  timestamp: z.union([z.bigint(), z.number(), z.string()]).transform(val => {
    if (typeof val === 'bigint') return val;
    if (typeof val === 'number') return BigInt(val);
    return BigInt(val);
  }),
  nonce: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
});

const createVoteSchema = z.object({
  contributionId: z.string().cuid(),
  type: z.enum(['PASS', 'FAIL', 'SKIP']),
  signature: z.string().regex(/^0x[a-fA-F0-9]{130}$/),
  signaturePayload: voteMessageSchema,
  chainId: z.string(),
});

const updateVoteSchema = z.object({
  contributionId: z.string().cuid(),
  type: z.enum(['PASS', 'FAIL', 'SKIP']),
  signature: z.string().regex(/^0x[a-fA-F0-9]{130}$/),
  signaturePayload: voteMessageSchema,
  chainId: z.string(),
});

const getVotesSchema = z.object({
  contributionId: z.string().cuid(),
});

const getMyVotesSchema = z.object({
  projectId: z.string().cuid(),
});

type VoteSignaturePayload = {
  voteId: string;
  voterId: string;
  type: VoteType;
  walletAddress: string;
  signature: string;
  signatureMessage: string;
  chainId: string | null;
  createdAt: Date;
};

type VotingDecision = {
  justPassed: boolean;
  finalStatus?: ContributionStatus;
};

async function collectVoteSignatures(contributionId: string): Promise<VoteSignaturePayload[]> {
  const votes = await db.vote.findMany({
    where: {
      contributionId,
      deletedAt: null,
      // 收集所有未软删的投票（无论 PASS/FAIL/SKIP），
      // 方便后续在链上或其他策略中统一使用。
    },
    include: {
      voter: {
        select: {
          walletAddress: true,
        },
      },
    },
  });

  const missingSignatureVotes = votes.filter(vote => !vote.signature || !vote.signatureMessage);

  if (missingSignatureVotes.length) {
    console.warn('[OnChainVoting] Missing signatures for votes', {
      contributionId,
      voteIds: missingSignatureVotes.map(vote => vote.id),
    });
  }

  return votes
    .filter(vote => vote.signature && vote.signatureMessage)
    .map(vote => ({
      voteId: vote.id,
      voterId: vote.voterId,
      type: vote.type,
      walletAddress: vote.voter.walletAddress,
      signature: vote.signature as string,
      signatureMessage: vote.signatureMessage as string,
      chainId: vote.signatureChainId,
      createdAt: vote.createdAt,
    }));
}

function assertUserCanVerify(
  userId: string,
  project: {
    validateType: ProjectValidateType;
    members: { userId: string; role: MemberRole[] }[];
  },
) {
  let canVerify = false;

  if (project.validateType === ProjectValidateType.SPECIFIC_MEMBERS) {
    canVerify = project.members.some(
      member => member.userId === userId && member.role.includes(MemberRole.VALIDATOR),
    );
  } else {
    canVerify = project.members.some(member => member.userId === userId);
  }

  if (!canVerify) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Only project validators can verify contributions on-chain',
    });
  }
}

// Apply voting strategy and check if contribution should change status
async function applyVotingStrategy(contributionId: string): Promise<VotingDecision> {
  const decision: VotingDecision = { justPassed: false };
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
    return decision;
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
    case 'simple': {
      // Simple majority across eligible voters: approvals must exceed 50% of all eligible validators
      if (eligibleVoters > 0) {
        const approvalThreshold = eligibleVoters / 2;
        shouldPass = passVotes > approvalThreshold;
        shouldFail = failVotes > approvalThreshold;
        statusDetermined = shouldPass || shouldFail;
      }
      break;
    }

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

    default: {
      // Fallback to simple majority across eligible voters
      if (eligibleVoters > 0) {
        const approvalThreshold = eligibleVoters / 2;
        shouldPass = passVotes > approvalThreshold;
        shouldFail = failVotes > approvalThreshold;
        statusDetermined = shouldPass || shouldFail;
      }
      break;
    }
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

    return {
      justPassed: shouldPass,
      finalStatus: newStatus,
    };
  }

  return decision;
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
        // Get user's wallet address
        const user = await db.user.findUnique({
          where: { id: userId },
          select: { walletAddress: true },
        });

        if (!user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'User not found',
          });
        }

        // Verify EIP-712 signature
        const verificationResult = await verifyEIP712Signature({
          signature: input.signature as `0x${string}`,
          message: {
            ...input.signaturePayload,
            voter: input.signaturePayload.voter as `0x${string}`,
          },
          expectedAddress: normalizeAddress(user.walletAddress) as Address,
          chainId: parseInt(input.chainId, 10),
        });

        if (!verificationResult.valid) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: `Signature verification failed: ${verificationResult.error}`,
          });
        }

        // Validate signature payload matches request
        const payload = input.signaturePayload;

        if (payload.contributionId !== input.contributionId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Contribution ID mismatch in signature payload',
          });
        }

        const expectedVoteType = getVoteTypeEnum(input.type);
        if (payload.voteType !== expectedVoteType) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Vote type mismatch in signature payload',
          });
        }

        if (payload.voter.toLowerCase() !== user.walletAddress.toLowerCase()) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Voter address mismatch in signature payload',
          });
        }

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
                signature: input.signature,
                signaturePayload: input.signaturePayload,
                signatureChainId: input.chainId,
                deletedAt: null,
                finalizedAt: null,
                updatedAt: new Date(),
              },
            });
          } else {
            // Update existing vote
            result = await db.vote.update({
              where: { id: existingVote.id },
              data: {
                type: input.type as VoteType,
                signature: input.signature,
                signaturePayload: input.signaturePayload,
                signatureChainId: input.chainId,
                finalizedAt: null,
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
              signature: input.signature,
              signaturePayload: input.signaturePayload,
              signatureChainId: input.chainId,
            },
          });
        }

        // Apply voting strategy to check if contribution status should change
        const decision = await applyVotingStrategy(input.contributionId);

        return {
          success: true,
          vote: result,
          message: 'Vote submitted and verified successfully',
          decision,
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
        select: {
          id: true,
          type: true,
          voterId: true,
          finalizedAt: true,
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
        // Get user's wallet address
        const user = await db.user.findUnique({
          where: { id: userId },
          select: { walletAddress: true },
        });

        if (!user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'User not found',
          });
        }

        // Verify EIP-712 signature
        const verificationResult = await verifyEIP712Signature({
          signature: input.signature as `0x${string}`,
          message: {
            ...input.signaturePayload,
            voter: input.signaturePayload.voter as `0x${string}`,
          },
          expectedAddress: normalizeAddress(user.walletAddress) as Address,
          chainId: parseInt(input.chainId, 10),
        });

        if (!verificationResult.valid) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: `Signature verification failed: ${verificationResult.error}`,
          });
        }

        // Validate signature payload matches request
        const payload = input.signaturePayload;

        if (payload.contributionId !== input.contributionId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Contribution ID mismatch in signature payload',
          });
        }

        const expectedVoteType = getVoteTypeEnum(input.type);
        if (payload.voteType !== expectedVoteType) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Vote type mismatch in signature payload',
          });
        }

        if (payload.voter.toLowerCase() !== user.walletAddress.toLowerCase()) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Voter address mismatch in signature payload',
          });
        }

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

        if (existingVote.finalizedAt) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Cannot update a finalized vote',
          });
        }

        // Update vote
        const result = await db.vote.update({
          where: { id: existingVote.id },
          data: {
            type: input.type as VoteType,
            signature: input.signature,
            signaturePayload: input.signaturePayload,
            signatureChainId: input.chainId,
            finalizedAt: null,
            updatedAt: new Date(),
          },
        });

        const decision = await applyVotingStrategy(input.contributionId);

        return {
          success: true,
          vote: result,
          message: 'Vote updated and verified successfully',
          decision,
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

  // Prepare payload for on-chain verification
  getOnChainPayload: protectedProcedure
    .input(z.object({ contributionId: z.string().cuid() }))
    .query(async ({ input, ctx }) => {
      const userId = (ctx as any).user?.id;

      const contribution = await db.contribution.findUnique({
        where: { id: input.contributionId, deletedAt: null },
        include: {
          project: {
            include: {
              members: {
                where: { deletedAt: null },
                select: { userId: true, role: true },
              },
            },
          },
        },
      });

      if (!contribution) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Contribution not found',
        });
      }

      if (contribution.status !== ContributionStatus.PASSED) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Contribution must be passed before preparing an on-chain payload',
        });
      }

      assertUserCanVerify(userId, contribution.project);

      const votes = await collectVoteSignatures(input.contributionId);

      if (!votes.length) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No signed votes available for on-chain verification',
        });
      }

      const eligibleVoters =
        contribution.project.validateType === ProjectValidateType.SPECIFIC_MEMBERS
          ? contribution.project.members.filter(member => member.role.includes(MemberRole.VALIDATOR)).length
          : contribution.project.members.length;

      return {
        project: {
          id: contribution.project.id,
          key: contribution.project.key,
          name: contribution.project.name,
          approvalStrategy: contribution.project.approvalStrategy,
        },
        contribution: {
          id: contribution.id,
          status: contribution.status,
          projectId: contribution.projectId,
        },
        votes,
        eligibleVoters,
      };
    }),

  // Mark contribution as verified on-chain
  confirmOnChain: protectedProcedure
    .input(z.object({
      contributionId: z.string().cuid(),
      txHash: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx as any).user?.id;

      const contribution = await db.contribution.findUnique({
        where: { id: input.contributionId, deletedAt: null },
        include: {
          project: {
            include: {
              members: {
                where: { deletedAt: null },
                select: { userId: true, role: true },
              },
            },
          },
        },
      });

      if (!contribution) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Contribution not found',
        });
      }

      if (contribution.status !== ContributionStatus.PASSED) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Only passed contributions can be marked as on-chain',
        });
      }

      assertUserCanVerify(userId, contribution.project);

      await db.$transaction(async tx => {
        await tx.contribution.update({
          where: { id: input.contributionId },
          data: {
            status: ContributionStatus.ON_CHAIN,
            updatedAt: new Date(),
          },
        });

        await tx.vote.updateMany({
          where: {
            contributionId: input.contributionId,
            deletedAt: null,
          },
          data: {
            finalizedAt: new Date(),
          },
        });
      });

      if (input.txHash) {
        console.log('[OnChainVoting] Contribution verified on-chain', {
          contributionId: input.contributionId,
          txHash: input.txHash,
        });
      }

      return {
        success: true,
        message: 'Contribution recorded on-chain',
        txHash: input.txHash,
      };
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
