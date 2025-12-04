import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { protectedProcedure } from '../middleware';
import { db } from '@/lib/db';
import {
  ContributionStatus,
  ProjectSubmitStrategy,
} from '@prisma/client';

// Input validation schemas
const createContributionSchema = z.object({
  projectId: z.string().cuid(),
  content: z.string().min(1, 'Content is required').max(2000, 'Content too long'),
  hours: z.number().min(0).max(1000).optional(),
  tags: z.array(z.string()).default([]),
  startAt: z.date().optional(),
  endAt: z.date().optional(),
  contributors: z.array(z.object({
    userId: z.string().cuid(),
    hours: z.number().min(0).optional(),
    points: z.number().min(0).optional(),
  })).min(1, 'At least one contributor is required'),
});

const updateContributionSchema = z.object({
  id: z.string().cuid(),
  content: z.string().min(1, 'Content is required').max(2000, 'Content too long'),
  hours: z.number().min(0).max(1000).optional(),
  tags: z.array(z.string()).default([]),
  startAt: z.date().optional(),
  endAt: z.date().optional(),
  contributors: z.array(z.object({
    userId: z.string().cuid(),
    hours: z.number().min(0).optional(),
    points: z.number().min(0).optional(),
  })).min(1, 'At least one contributor is required'),
});

const listContributionsSchema = z.object({
  projectId: z.string().cuid(),
  status: z.enum(['VALIDATING', 'PASSED', 'FAILED', 'ON_CHAIN']).optional(),
  contributorId: z.string().cuid().optional(),
  search: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(20),
});

const listContributionsByContributorSchema = z.object({
  contributorId: z.string().cuid(),
  status: z.enum(['VALIDATING', 'PASSED', 'FAILED', 'ON_CHAIN']).optional(),
  search: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(20),
});

// Helper function to check submission permissions
async function checkSubmissionPermissions(userId: string, projectId: string) {
  const project = await db.project.findUnique({
    where: { id: projectId, deletedAt: null },
    include: {
      members: {
        where: { deletedAt: null },
        include: { user: true },
      },
    },
  });

  if (!project) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Project not found',
    });
  }

  // If project allows everyone to submit, allow it
  if (project.submitStrategy === ProjectSubmitStrategy.EVERYONE) {
    return project;
  }

  // If restricted, check if user is a member
  const isMember = project.members.some(member => member.userId === userId);
  if (!isMember) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have permission to submit contributions to this project',
    });
  }

  return project;
}

export const contributionRouter = createTRPCRouter({
  // Create new contribution
  create: protectedProcedure
    .input(createContributionSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx as any).user?.id;

      try {
        // Check submission permissions
        await checkSubmissionPermissions(userId, input.projectId);

        // Validate that all contributor users exist
        const contributorUsers = await db.user.findMany({
          where: {
            id: { in: input.contributors.map(c => c.userId) },
            deletedAt: null,
          },
        });

        if (contributorUsers.length !== input.contributors.length) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Some contributors do not exist',
          });
        }

        // Create contribution with contributors in a transaction
        const result = await db.$transaction(async (tx) => {
          const contribution = await tx.contribution.create({
            data: {
              content: input.content,
              hours: input.hours,
              tags: input.tags,
              startAt: input.startAt,
              endAt: input.endAt,
              projectId: input.projectId,
              status: ContributionStatus.VALIDATING,
            },
          });

          // Add contributors
          await tx.contributionContributor.createMany({
            data: input.contributors.map(contributor => ({
              contributionId: contribution.id,
              contributorId: contributor.userId,
              hours: contributor.hours,
              points: contributor.points,
            })),
          });

          return contribution;
        });

        return {
          success: true,
          contribution: result,
          message: 'Contribution created successfully',
        };
      } catch (error) {
        console.error('Error creating contribution:', error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create contribution',
        });
      }
    }),

  // Get single contribution by ID
  get: publicProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ input }) => {
      const contribution = await db.contribution.findUnique({
        where: { id: input.id, deletedAt: null },
        include: {
          project: {
            select: {
              id: true,
              key: true,
              name: true,
            },
          },
          contributors: {
            where: { deletedAt: null },
            include: {
              contributor: {
                select: {
                  id: true,
                  walletAddress: true,
                  ensName: true,
                  name: true,
                  avatar: true,
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
                  ensName: true,
                  name: true,
                  avatar: true,
                },
              },
            },
          },
          _count: {
            select: {
              votes: {
                where: { deletedAt: null },
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

      return contribution;
    }),

  // List contributions with filtering and pagination
  list: publicProcedure
    .input(listContributionsSchema)
    .query(async ({ input }) => {
      const { projectId, status, contributorId, search, page, limit } = input;
      const skip = (page - 1) * limit;

      // Build where conditions
      const whereConditions: any = {
        projectId,
        deletedAt: null,
      };

      if (status) {
        whereConditions.status = status;
      }

      if (contributorId) {
        whereConditions.contributors = {
          some: {
            contributorId,
            deletedAt: null,
          },
        };
      }

      if (search && search.trim()) {
        whereConditions.content = {
          contains: search,
          mode: 'insensitive',
        };
      }

      // Execute query with pagination
      const [contributions, totalCount] = await Promise.all([
        db.contribution.findMany({
          where: whereConditions,
          include: {
            contributors: {
              where: { deletedAt: null },
              include: {
                contributor: {
                  select: {
                    id: true,
                    walletAddress: true,
                    ensName: true,
                    name: true,
                    avatar: true,
                  },
                },
              },
            },
            votes: {
              where: { deletedAt: null },
              select: {
                id: true,
                type: true,
                voterId: true,
              },
            },
            _count: {
              select: {
                votes: {
                  where: { deletedAt: null },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        db.contribution.count({
          where: whereConditions,
        }),
      ]);

      return {
        contributions,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNext: page * limit < totalCount,
          hasPrev: page > 1,
        },
      };
    }),

  // List contributions by contributor across projects
  listByContributor: publicProcedure
    .input(listContributionsByContributorSchema)
    .query(async ({ input }) => {
      const { contributorId, status, search, page, limit } = input;
      const skip = (page - 1) * limit;

      const statusFilter = status ? [status] : null;

      const whereConditions: any = {
        deletedAt: null,
        contributors: {
          some: {
            contributorId,
            deletedAt: null,
          },
        },
      };

      if (statusFilter) {
        whereConditions.status =
          statusFilter.length === 1
            ? statusFilter[0]
            : {
                in: statusFilter,
              };
      }

      if (search && search.trim()) {
        whereConditions.content = {
          contains: search,
          mode: 'insensitive',
        };
      }

      const [contributions, totalCount] = await Promise.all([
        db.contribution.findMany({
          where: whereConditions,
          include: {
            project: {
              select: {
                id: true,
                key: true,
                name: true,
                logo: true,
              },
            },
            contributors: {
              where: { deletedAt: null },
              include: {
                contributor: {
                  select: {
                    id: true,
                    walletAddress: true,
                    ensName: true,
                    name: true,
                    avatar: true,
                  },
                },
              },
            },
            votes: {
              where: { deletedAt: null },
              select: {
                id: true,
                type: true,
                voterId: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        db.contribution.count({
          where: whereConditions,
        }),
      ]);

      return {
        contributions,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNext: page * limit < totalCount,
          hasPrev: page > 1,
        },
      };
    }),

  // Update contribution (creates new version, resets votes)
  update: protectedProcedure
    .input(updateContributionSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx as any).user?.id;

      try {
        // Check if contribution exists and user has permission to edit
        const existingContribution = await db.contribution.findUnique({
          where: { id: input.id, deletedAt: null },
          include: {
            contributors: {
              where: { deletedAt: null },
              select: { contributorId: true },
            },
            project: {
              select: {
                id: true,
                ownerId: true,
              },
            },
          },
        });

        if (!existingContribution) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Contribution not found',
          });
        }

        // Check if user is a contributor or project owner
        const isContributor = existingContribution.contributors.some(
          c => c.contributorId === userId
        );
        const isProjectOwner = existingContribution.project.ownerId === userId;

        if (!isContributor && !isProjectOwner) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to edit this contribution',
          });
        }

        // Prevent editing of passed contributions as they are finalized
        if (existingContribution.status === ContributionStatus.PASSED) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Cannot edit a passed contribution. It has been finalized and cannot be modified.',
          });
        }

        // Validate that all contributor users exist
        const contributorUsers = await db.user.findMany({
          where: {
            id: { in: input.contributors.map(c => c.userId) },
            deletedAt: null,
          },
        });

        if (contributorUsers.length !== input.contributors.length) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Some contributors do not exist',
          });
        }

        // Create new version of contribution and preserve history
        const result = await db.$transaction(async (tx) => {
          // Soft delete the old contribution (preserve history)
          await tx.contribution.update({
            where: { id: input.id },
            data: {
              deletedAt: new Date(),
            },
          });

          // Soft delete all existing votes for the old contribution
          await tx.vote.updateMany({
            where: {
              contributionId: input.id,
              deletedAt: null,
            },
            data: {
              deletedAt: new Date(),
            },
          });

          // Soft delete existing contributors for the old contribution
          await tx.contributionContributor.updateMany({
            where: {
              contributionId: input.id,
              deletedAt: null,
            },
            data: {
              deletedAt: new Date(),
            },
          });

          // Create new contribution version
          const newContribution = await tx.contribution.create({
            data: {
              content: input.content,
              hours: input.hours,
              tags: input.tags,
              startAt: input.startAt,
              endAt: input.endAt,
              status: ContributionStatus.VALIDATING,
              projectId: existingContribution.projectId,
            },
          });

          // Add contributors for the new contribution
          await tx.contributionContributor.createMany({
            data: input.contributors.map(contributor => ({
              contributionId: newContribution.id,
              contributorId: contributor.userId,
              hours: contributor.hours,
              points: contributor.points,
            })),
          });

          return newContribution;
        });

        return {
          success: true,
          contribution: result,
          message: 'Contribution updated successfully. Voting has been reset.',
        };
      } catch (error) {
        console.error('Error updating contribution:', error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update contribution',
        });
      }
    }),

  // Soft delete contribution
  delete: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx as any).user?.id;

      try {
        // Check if contribution exists and user has permission to delete
        const contribution = await db.contribution.findUnique({
          where: { id: input.id, deletedAt: null },
          include: {
            contributors: {
              where: { deletedAt: null },
              select: { contributorId: true },
            },
            project: {
              select: {
                ownerId: true,
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

        // Check if user is a contributor or project owner
        const isContributor = contribution.contributors.some(
          c => c.contributorId === userId
        );
        const isProjectOwner = contribution.project.ownerId === userId;

        if (!isContributor && !isProjectOwner) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to delete this contribution',
          });
        }

        // Prevent deletion of passed contributions as they are finalized
        if (contribution.status === ContributionStatus.PASSED) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Cannot delete a passed contribution. It has been finalized and cannot be removed.',
          });
        }

        // Soft delete contribution
        await db.contribution.update({
          where: { id: input.id },
          data: { deletedAt: new Date() },
        });

        return {
          success: true,
          message: 'Contribution deleted successfully',
        };
      } catch (error) {
        console.error('Error deleting contribution:', error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete contribution',
        });
      }
    }),
});
