import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { protectedProcedure } from '../middleware';
import { db } from '@/lib/db';
import {
  MemberRole,
  ProjectValidateType,
  ProjectSubmitStrategy,
} from '@prisma/client';

// Input validation schema for creating a project
const createProjectSchema = z.object({
  // Basic Information
  logo: z.string().url('Invalid logo URL'),
  projectName: z
    .string()
    .min(2, 'Project name must be at least 2 characters')
    .max(50, 'Project name must not exceed 50 characters')
    .regex(
      /^[a-zA-Z0-9\s\-_\.]+$/,
      'Project name can only contain letters, numbers, spaces, hyphens, underscores, and dots',
    ),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(150, 'Description must not exceed 150 characters'),
  tokenName: z
    .string()
    .min(2, 'Token name must be at least 2 characters')
    .max(20, 'Token name must not exceed 20 characters')
    .regex(
      /^[A-Z0-9_]+$/,
      'Token name must be uppercase letters, numbers, and underscores only',
    ),

  // Validation Settings
  validateType: z.enum(['specific', 'all']),
  validationStrategy: z.enum(['simple', 'quorum', 'absolute', 'relative']),
  validationPeriodDays: z
    .number()
    .min(0, 'Validation period cannot be negative')
    .max(365, 'Validation period must not exceed 365 days')
    .optional(),

  // Submission Settings
  submitterType: z.enum(['everyone', 'restricted']),
  defaultHourlyPay: z
    .number()
    .min(0, 'Hourly pay cannot be negative')
    .max(10000, 'Hourly pay cannot exceed 10,000')
    .optional(),

  // Team Management
  projectOwner: z
    .string()
    .regex(
      /^(0x[a-fA-F0-9]{40}|.+\.eth)$/,
      'Must be a valid Ethereum address (0x...) or ENS domain (.eth)',
    ),

  // Team Members (Optional)
  members: z
    .array(
      z.object({
        address: z.string().min(1, 'Member address is required'),
        isValidator: z.boolean(),
        isContributor: z.boolean(),
        isAdmin: z.boolean(),
      }),
    )
    .optional(),

  // Other Links (Optional)
  otherLinks: z
    .array(
      z.object({
        type: z.enum([
          'twitter',
          'telegram',
          'website',
          'github',
          'discord',
          'custom',
        ]),
        url: z
          .string()
          .regex(/^https?:\/\/.+/, 'URL must start with http:// or https://'),
      }),
    )
    .optional(),
});

// Helper function to generate unique project key
function generateProjectKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .substring(0, 30); // Limit length
}

// Helper function to find or create user by wallet address
async function findOrCreateUser(walletAddress: string) {
  // First try to find existing user
  let user = await db.user.findUnique({
    where: { walletAddress: walletAddress.toLowerCase() },
  });

  // If user doesn't exist, create one
  if (!user) {
    user = await db.user.create({
      data: {
        walletAddress: walletAddress.toLowerCase(),
      },
    });
  }

  return user;
}

export const projectRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createProjectSchema)
    .mutation(
      async ({
        input,
        ctx,
      }: {
        input: z.infer<typeof createProjectSchema>;
        ctx: any;
      }) => {
        const userId = ctx.user?.id;

        try {
          // Generate unique project key
          let projectKey = generateProjectKey(input.projectName);

          // Ensure project key is unique
          let keyExists = await db.project.findUnique({
            where: { key: projectKey },
          });

          let counter = 1;
          while (keyExists) {
            projectKey = `${generateProjectKey(input.projectName)}-${counter}`;
            keyExists = await db.project.findUnique({
              where: { key: projectKey },
            });
            counter++;
          }

          // Find or create project owner user
          const projectOwner = await findOrCreateUser(input.projectOwner);

          // Map validation settings
          const validateType =
            input.validateType === 'specific'
              ? ProjectValidateType.SPECIFIC_MEMBERS
              : ProjectValidateType.ALL_MEMBERS;

          const submitStrategy =
            input.submitterType === 'everyone'
              ? ProjectSubmitStrategy.EVERYONE
              : ProjectSubmitStrategy.RESTRICTED;

          // Prepare approval strategy JSON
          const approvalStrategy = {
            strategy: input.validationStrategy,
            periodDays: input.validationPeriodDays || 0,
          };

          // Prepare links JSON
          const links = input.otherLinks
            ? {
                otherLinks: input.otherLinks,
              }
            : undefined;

          // Create project in transaction
          const result = await db.$transaction(async (tx) => {
            // Create the project
            const project = await tx.project.create({
              data: {
                key: projectKey,
                name: input.projectName,
                description: input.description,
                logo: input.logo,
                tokenSymbol: input.tokenName,
                validateType,
                approvalStrategy,
                submitStrategy,
                ownerId: projectOwner.id,
                defaultHourRate: input.defaultHourlyPay || null,
                links,
              },
            });

            // Add project owner as admin member if not already in members list
            const ownerInMembers = input.members?.some(
              (member) =>
                member.address.toLowerCase() ===
                input.projectOwner.toLowerCase(),
            );

            if (!ownerInMembers) {
              await tx.projectMember.create({
                data: {
                  userId: projectOwner.id,
                  projectId: project.id,
                  role: [
                    MemberRole.ADMIN,
                    MemberRole.VALIDATOR,
                    MemberRole.CONTRIBUTOR,
                  ],
                },
              });
            }

            // Add other members
            if (input.members && input.members.length > 0) {
              for (const member of input.members) {
                const memberUser = await findOrCreateUser(member.address);

                // Build roles array
                const roles: MemberRole[] = [];
                if (member.isAdmin) roles.push(MemberRole.ADMIN);
                if (member.isValidator) roles.push(MemberRole.VALIDATOR);
                if (member.isContributor) roles.push(MemberRole.CONTRIBUTOR);

                // If no roles specified, default to CONTRIBUTOR
                if (roles.length === 0) {
                  roles.push(MemberRole.CONTRIBUTOR);
                }

                await tx.projectMember.create({
                  data: {
                    userId: memberUser.id,
                    projectId: project.id,
                    role: roles,
                  },
                });
              }
            }

            return project;
          });

          return {
            success: true,
            project: {
              id: result.id,
              key: result.key,
              name: result.name,
              description: result.description,
              logo: result.logo,
              tokenSymbol: result.tokenSymbol,
            },
            message: 'Project created successfully!',
          };
        } catch (error) {
          console.error('Error creating project:', error);

          if (error instanceof TRPCError) {
            throw error;
          }

          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create project. Please try again.',
          });
        }
      },
    ),

  // Get project by key or ID
  get: publicProcedure
    .input(z.object({ 
      key: z.string().optional(),
      id: z.string().cuid().optional()
    }).refine(data => data.key || data.id, { message: "Either key or id must be provided" }))
    .query(async ({ input }: { input: { key?: string; id?: string } }) => {
      const whereCondition = input.key 
        ? { key: input.key, deletedAt: null }
        : { id: input.id, deletedAt: null };
      const project = await db.project.findUnique({
        where: whereCondition,
        include: {
          owner: {
            select: {
              id: true,
              walletAddress: true,
              ensName: true,
              name: true,
              avatar: true,
            },
          },
          members: {
            where: { deletedAt: null },
            include: {
              user: {
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
              contributions: {
                where: { deletedAt: null },
              },
            },
          },
        },
      });

      if (!project) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        });
      }

      return project;
    }),

  // Unified project list with filtering
  list: publicProcedure
    .input(
      z.object({
        filter: z.enum(['all', 'my', 'following']).default('all'),
        search: z.string().optional(),
        sortBy: z
          .enum(['popularity', 'recent', 'contributions', 'members'])
          .default('recent'),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(12),
      }),
    )
    .query(async ({ input, ctx }: { input: any; ctx: any }) => {
      const userId = ctx.user?.id;
      const { filter, search, sortBy, page, limit } = input;
      const skip = (page - 1) * limit;

      // Build where conditions based on filter
      let whereConditions: any = {
        deletedAt: null,
        status: 'ACTIVE',
      };

      if (filter === 'my') {
        whereConditions.OR = [
          { ownerId: userId },
          {
            members: {
              some: {
                userId: userId,
                deletedAt: null,
              },
            },
          },
        ];
      } else if (filter === 'following') {
        whereConditions.followers = {
          some: {
            userId: userId,
            deletedAt: null,
          },
        };
      }

      // Add search conditions
      if (search && search.trim()) {
        const searchConditions = {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        };
        whereConditions = { ...whereConditions, ...searchConditions };
      }

      // Build orderBy based on sortBy
      let orderBy: any = { createdAt: 'desc' };
      if (sortBy === 'popularity') {
        orderBy = [{ followers: { _count: 'desc' } }, { createdAt: 'desc' }];
      } else if (sortBy === 'contributions') {
        orderBy = [
          { contributions: { _count: 'desc' } },
          { createdAt: 'desc' },
        ];
      } else if (sortBy === 'members') {
        orderBy = [{ members: { _count: 'desc' } }, { createdAt: 'desc' }];
      }

      // Execute query with pagination
      const [projects, totalCount] = await Promise.all([
        db.project.findMany({
          where: whereConditions,
          include: {
            owner: {
              select: {
                id: true,
                walletAddress: true,
                ensName: true,
                name: true,
                avatar: true,
              },
            },
            _count: {
              select: {
                contributions: {
                  where: { deletedAt: null },
                },
                members: {
                  where: { deletedAt: null },
                },
                followers: {
                  where: { deletedAt: null },
                },
              },
            },
            followers: userId
              ? {
                  where: {
                    userId: userId,
                    deletedAt: null,
                  },
                  select: {
                    id: true,
                  },
                }
              : false,
          },
          orderBy,
          skip,
          take: limit,
        }),
        db.project.count({
          where: whereConditions,
        }),
      ]);

      // Add isFollowed flag for authenticated users
      const projectsWithFollowStatus = projects.map((project) => ({
        ...project,
        isFollowed: userId ? project.followers.length > 0 : false,
        followers: undefined, // Remove followers array from response
      }));

      return {
        projects: projectsWithFollowStatus,
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

  // Follow a project
  follow: protectedProcedure
    .input(z.object({ projectKey: z.string() }))
    .mutation(async ({ input, ctx }: { input: any; ctx: any }) => {
      const userId = ctx.user?.id;
      const { projectKey } = input;

      try {
        // Find the project
        const project = await db.project.findUnique({
          where: { key: projectKey, deletedAt: null },
        });

        if (!project) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Project not found',
          });
        }

        // Check if already following
        const existingFollow = await db.projectFollow.findUnique({
          where: {
            userId_projectId: {
              userId: userId,
              projectId: project.id,
            },
          },
        });

        if (existingFollow && !existingFollow.deletedAt) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Already following this project',
          });
        }

        // Create or restore follow relationship
        if (existingFollow && existingFollow.deletedAt) {
          // Restore soft-deleted follow
          await db.projectFollow.update({
            where: { id: existingFollow.id },
            data: { deletedAt: null },
          });
        } else {
          // Create new follow
          await db.projectFollow.create({
            data: {
              userId: userId,
              projectId: project.id,
            },
          });
        }

        return { success: true, message: 'Successfully followed project' };
      } catch (error) {
        console.error('Error following project:', error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to follow project',
        });
      }
    }),

  // Unfollow a project
  unfollow: protectedProcedure
    .input(z.object({ projectKey: z.string() }))
    .mutation(async ({ input, ctx }: { input: any; ctx: any }) => {
      const userId = ctx.user?.id;
      const { projectKey } = input;

      try {
        // Find the project
        const project = await db.project.findUnique({
          where: { key: projectKey, deletedAt: null },
        });

        if (!project) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Project not found',
          });
        }

        // Find existing follow relationship
        const existingFollow = await db.projectFollow.findUnique({
          where: {
            userId_projectId: {
              userId: userId,
              projectId: project.id,
            },
          },
        });

        if (!existingFollow || existingFollow.deletedAt) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Not following this project',
          });
        }

        // Soft delete the follow relationship
        await db.projectFollow.update({
          where: { id: existingFollow.id },
          data: { deletedAt: new Date() },
        });

        return { success: true, message: 'Successfully unfollowed project' };
      } catch (error) {
        console.error('Error unfollowing project:', error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to unfollow project',
        });
      }
    }),

  // Update project
  update: protectedProcedure
    .input(createProjectSchema.extend({
      id: z.string().cuid(),
      validateType: z.enum(['specific', 'all']).optional(),
      validationStrategy: z.enum(['simple', 'quorum', 'absolute', 'relative']).optional(),
    }))
    .mutation(async ({ input, ctx }: { input: any; ctx: any }) => {
      const userId = ctx.user?.id;

      try {
        // Check if project exists and user has permission to edit
        const existingProject = await db.project.findUnique({
          where: { id: input.id, deletedAt: null },
          select: {
            id: true,
            ownerId: true,
            key: true,
          },
        });

        if (!existingProject) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Project not found',
          });
        }

        if (existingProject.ownerId !== userId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to edit this project',
          });
        }

        // Generate unique project key if name changed
        let projectKey = existingProject.key;
        if (input.projectName) {
          let newKey = generateProjectKey(input.projectName);
          
          // Only change key if it's different and ensure uniqueness
          if (newKey !== existingProject.key) {
            let keyExists = await db.project.findUnique({
              where: { key: newKey },
            });

            let counter = 1;
            while (keyExists && keyExists.id !== input.id) {
              newKey = `${generateProjectKey(input.projectName)}-${counter}`;
              keyExists = await db.project.findUnique({
                where: { key: newKey },
              });
              counter++;
            }
            projectKey = newKey;
          }
        }

        // Find or create project owner user if changed
        let ownerId = existingProject.ownerId;
        if (input.projectOwner) {
          const projectOwner = await findOrCreateUser(input.projectOwner);
          ownerId = projectOwner.id;
        }

        // Map validation settings (keep existing if not provided)
        const validateType = input.validateType
          ? input.validateType === 'specific'
            ? ProjectValidateType.SPECIFIC_MEMBERS
            : ProjectValidateType.ALL_MEMBERS
          : undefined;

        const submitStrategy = input.submitterType
          ? input.submitterType === 'everyone'
            ? ProjectSubmitStrategy.EVERYONE
            : ProjectSubmitStrategy.RESTRICTED
          : undefined;

        // Prepare approval strategy JSON
        const approvalStrategy = input.validationStrategy
          ? {
              strategy: input.validationStrategy,
              periodDays: input.validationPeriodDays || 0,
            }
          : undefined;

        // Prepare links JSON
        const links = input.otherLinks
          ? {
              otherLinks: input.otherLinks,
            }
          : undefined;

        // Update project in transaction
        const result = await db.$transaction(async (tx) => {
          // Update the project
          const project = await tx.project.update({
            where: { id: input.id },
            data: {
              key: projectKey,
              name: input.projectName,
              description: input.description,
              logo: input.logo,
              tokenSymbol: input.tokenName,
              ...(validateType && { validateType }),
              ...(approvalStrategy && { approvalStrategy }),
              ...(submitStrategy && { submitStrategy }),
              ownerId,
              defaultHourRate: input.defaultHourlyPay || null,
              ...(links && { links }),
              updatedAt: new Date(),
            },
          });

          // Update members if provided
          if (input.members && input.members.length > 0) {
            // Soft delete existing members
            await tx.projectMember.updateMany({
              where: {
                projectId: input.id,
                deletedAt: null,
              },
              data: {
                deletedAt: new Date(),
              },
            });

            // Add updated members
            for (const member of input.members) {
              const memberUser = await findOrCreateUser(member.address);

              // Build roles array
              const roles: MemberRole[] = [];
              if (member.isAdmin) roles.push(MemberRole.ADMIN);
              if (member.isValidator) roles.push(MemberRole.VALIDATOR);
              if (member.isContributor) roles.push(MemberRole.CONTRIBUTOR);

              // If no roles specified, default to CONTRIBUTOR
              if (roles.length === 0) {
                roles.push(MemberRole.CONTRIBUTOR);
              }

              await tx.projectMember.create({
                data: {
                  userId: memberUser.id,
                  projectId: input.id,
                  role: roles,
                },
              });
            }

            // Ensure project owner is still a member with all roles
            const ownerInMembers = input.members?.some(
              (member: any) =>
                member.address.toLowerCase() === input.projectOwner?.toLowerCase(),
            );

            if (!ownerInMembers && input.projectOwner) {
              await tx.projectMember.create({
                data: {
                  userId: ownerId,
                  projectId: input.id,
                  role: [
                    MemberRole.ADMIN,
                    MemberRole.VALIDATOR,
                    MemberRole.CONTRIBUTOR,
                  ],
                },
              });
            }
          }

          return project;
        });

        return {
          success: true,
          project: {
            id: result.id,
            key: result.key,
            name: result.name,
            description: result.description,
            logo: result.logo,
            tokenSymbol: result.tokenSymbol,
          },
          message: 'Project updated successfully!',
        };
      } catch (error) {
        console.error('Error updating project:', error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update project. Please try again.',
        });
      }
    }),
});
