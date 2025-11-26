import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { protectedProcedure } from '../middleware';
import { db } from '@/lib/db';
import {
  MemberRole,
  ProjectValidateType,
  ProjectSubmitStrategy,
  ProjectStatus,
} from '@prisma/client';
import { generateProjectKey } from '@/utils/project';
import cuid from 'cuid';
import { stringIdToBytes32 } from '../utils/id';

const memberInputSchema = z.object({
  address: z.string().min(1, 'Member address is required'),
  isValidator: z.boolean(),
  isContributor: z.boolean(),
  isAdmin: z.boolean(),
});

const otherLinkInputSchema = z.object({
  type: z.enum([
    'twitter',
    'telegram',
    'website',
    'github',
    'discord',
    'custom',
  ]),
  url: z.string().regex(/^https?:\/\/.+/, 'URL must start with http:// or https://'),
});

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
  members: z.array(memberInputSchema).optional(),

  // Other Links (Optional)
  otherLinks: z.array(otherLinkInputSchema).optional(),
  projectId: z.string().optional(),
  projectIdBytes32: z
    .string()
    .regex(/^0x[a-fA-F0-9]{64}$/, 'projectIdBytes32 must be 32 bytes hex')
    .optional(),
  onChainAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'onChainAddress must be a valid address')
    .optional(),
});

const updateProjectSchema = z.object({
  projectId: z.string().cuid(),
  payload: z.object({
    logo: z.string().url('Invalid logo URL').nullable(),
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
    validateType: z.enum(['specific', 'all']),
    validationStrategy: z.enum(['simple', 'quorum', 'absolute', 'relative']),
    validationPeriodDays: z
      .number()
      .min(0, 'Validation period cannot be negative')
      .max(365, 'Validation period must not exceed 365 days')
      .optional(),
    submitterType: z.enum(['everyone', 'restricted']),
    defaultHourlyPay: z
      .number()
      .min(0, 'Hourly pay cannot be negative')
      .max(10000, 'Hourly pay cannot exceed 10,000')
      .nullable(),
    projectOwner: z
      .string()
      .regex(
        /^(0x[a-fA-F0-9]{40}|.+\.eth)$/,
        'Must be a valid Ethereum address (0x...) or ENS domain (.eth)',
      ),
    members: z.array(memberInputSchema),
    otherLinks: z.array(otherLinkInputSchema).optional(),
  }),
});

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
  reserveId: protectedProcedure.mutation(async () => {
    return {
      projectId: cuid(),
    };
  }),

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

          const generatedProjectId = input.projectId ?? cuid();
          const generatedProjectIdBytes32 =
            input.projectIdBytes32 ?? stringIdToBytes32(generatedProjectId);

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
                id: generatedProjectId,
                key: projectKey,
                projectIdBytes32: generatedProjectIdBytes32,
                onChainAddress: input.onChainAddress,
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
              members: {
                where: { deletedAt: null },
              },
              followers: {
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

  update: protectedProcedure
    .input(updateProjectSchema)
    .mutation(
      async ({
        input,
        ctx,
      }: {
        input: z.infer<typeof updateProjectSchema>;
        ctx: any;
      }) => {
        const userId = ctx.user?.id;
        if (!userId) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          });
        }

        const { projectId, payload } = input;

        const project = await db.project.findUnique({
          where: { id: projectId, deletedAt: null },
        });

        if (!project) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Project not found',
          });
        }

        const membership = await db.projectMember.findUnique({
          where: {
            userId_projectId: {
              userId,
              projectId,
            },
          },
        });

        if (
          !membership ||
          membership.deletedAt !== null ||
          !membership.role.includes(MemberRole.ADMIN)
        ) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only project admins can edit project details',
          });
        }

        const userCache = new Map<
          string,
          Awaited<ReturnType<typeof findOrCreateUser>>
        >();
        const cacheUser = async (address: string) => {
          const normalized = address.toLowerCase();
          if (userCache.has(normalized)) {
            return userCache.get(normalized)!;
          }
          const user = await findOrCreateUser(address);
          userCache.set(normalized, user);
          return user;
        };

        const ownerUser = await cacheUser(payload.projectOwner);
        for (const member of payload.members) {
          const trimmed = member.address.trim();
          if (trimmed) {
            await cacheUser(trimmed);
          }
        }

        const formattedLinks =
          payload.otherLinks && payload.otherLinks.length > 0
            ? {
                otherLinks: payload.otherLinks.map((link) => ({
                  ...link,
                  url: link.url.trim(),
                })),
              }
            : null;

        const validateType =
          payload.validateType === 'specific'
            ? ProjectValidateType.SPECIFIC_MEMBERS
            : ProjectValidateType.ALL_MEMBERS;

        const submitStrategy =
          payload.submitterType === 'everyone'
            ? ProjectSubmitStrategy.EVERYONE
            : ProjectSubmitStrategy.RESTRICTED;

        const approvalStrategy = {
          strategy: payload.validationStrategy,
          periodDays: payload.validationPeriodDays || 0,
        };

        const updatedProjectId = await db.$transaction(async (tx) => {
          const currentProject = await tx.project.findUnique({
            where: { id: projectId },
          });

          if (!currentProject || currentProject.deletedAt) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Project not found',
            });
          }

          const proposedKey = generateProjectKey(payload.projectName);
          let nextKey = currentProject.key;

          if (proposedKey && proposedKey !== currentProject.key) {
            const conflict = await tx.project.findUnique({
              where: { key: proposedKey },
            });

            if (conflict && conflict.id !== currentProject.id) {
              throw new TRPCError({
                code: 'CONFLICT',
                message: 'Project slug already exists. Try a different name.',
              });
            }

            nextKey = proposedKey;
          }

          await tx.project.update({
            where: { id: projectId },
            data: {
              key: nextKey,
              name: payload.projectName,
              description: payload.description,
              logo: payload.logo ?? null,
              tokenSymbol: payload.tokenName,
              validateType,
              approvalStrategy,
              submitStrategy,
              ownerId: ownerUser.id,
              defaultHourRate:
                payload.defaultHourlyPay === null
                  ? null
                  : payload.defaultHourlyPay,
              links: formattedLinks,
            },
          });

          const existingMembers = await tx.projectMember.findMany({
            where: { projectId },
          });

          const memberTargets = new Map<
            string,
            { roles: MemberRole[]; walletAddress: string }
          >();

          for (const member of payload.members) {
            const normalized = member.address.trim().toLowerCase();
            if (!normalized) continue;
            const user = userCache.get(normalized);
            if (!user) continue;

            const roles: MemberRole[] = [];
            if (member.isAdmin) roles.push(MemberRole.ADMIN);
            if (member.isValidator) roles.push(MemberRole.VALIDATOR);
            if (member.isContributor) roles.push(MemberRole.CONTRIBUTOR);
            if (roles.length === 0) {
              roles.push(MemberRole.CONTRIBUTOR);
            }

            memberTargets.set(user.id, {
              roles: Array.from(new Set(roles)),
              walletAddress: user.walletAddress,
            });
          }

          const ownerRoles = memberTargets.get(ownerUser.id)?.roles ?? [];
          if (!ownerRoles.includes(MemberRole.ADMIN)) {
            ownerRoles.push(MemberRole.ADMIN);
          }
          if (!ownerRoles.includes(MemberRole.VALIDATOR)) {
            ownerRoles.push(MemberRole.VALIDATOR);
          }
          if (!ownerRoles.includes(MemberRole.CONTRIBUTOR)) {
            ownerRoles.push(MemberRole.CONTRIBUTOR);
          }
          memberTargets.set(ownerUser.id, {
            roles: Array.from(new Set(ownerRoles)),
            walletAddress: ownerUser.walletAddress,
          });

          const existingMap = new Map(existingMembers.map((m) => [m.userId, m]));

          for (const [memberUserId, data] of memberTargets.entries()) {
            const existingMember = existingMap.get(memberUserId);
            if (existingMember) {
              await tx.projectMember.update({
                where: { id: existingMember.id },
                data: {
                  role: data.roles,
                  deletedAt: null,
                },
              });
            } else {
              await tx.projectMember.create({
                data: {
                  userId: memberUserId,
                  projectId,
                  role: data.roles,
                },
              });
            }
          }

          for (const existingMember of existingMembers) {
            if (
              existingMember.userId !== ownerUser.id &&
              !memberTargets.has(existingMember.userId) &&
              !existingMember.deletedAt
            ) {
              await tx.projectMember.update({
                where: { id: existingMember.id },
                data: {
                  deletedAt: new Date(),
                },
              });
            }
          }

          return project.id;
        });

        const refreshedProject = await db.project.findUnique({
          where: { id: updatedProjectId },
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
                members: {
                  where: { deletedAt: null },
                },
                followers: {
                  where: { deletedAt: null },
                },
              },
            },
          },
        });

        if (!refreshedProject) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Failed to load updated project',
          });
        }

        return {
          success: true,
          message: 'Project updated successfully',
          project: refreshedProject,
        };
      },
    ),

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
        status: ProjectStatus.ACTIVE,
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

  // Get counts for all tabs
  getCounts: publicProcedure
    .query(async ({ ctx }: { ctx: any }) => {
      const userId = ctx.user?.id;
      
      // Build base conditions
      const baseConditions = {
        deletedAt: null,
        status: ProjectStatus.ACTIVE,
      };

      // Get counts for each tab
      const [allCount, myCount, followingCount] = await Promise.all([
        // All projects count
        db.project.count({
          where: baseConditions,
        }),
        // My projects count (owned or member)
        userId ? db.project.count({
          where: {
            ...baseConditions,
            OR: [
              { ownerId: userId },
              {
                members: {
                  some: {
                    userId: userId,
                    deletedAt: null,
                  },
                },
              },
            ],
          },
        }) : 0,
        // Following projects count
        userId ? db.project.count({
          where: {
            ...baseConditions,
            followers: {
              some: {
                userId: userId,
                deletedAt: null,
              },
            },
          },
        }) : 0,
      ]);

      return {
        all: allCount,
        my: myCount,
        following: followingCount,
      };
    }),

});
