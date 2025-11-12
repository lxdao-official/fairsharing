import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { protectedProcedure } from '../middleware';
import { db } from '@/lib/db';
import {
  generateNonce,
  generateLoginMessage,
  verifySignature,
  generateJWT,
  type AuthSession,
} from '@/lib/auth';
import { ProjectStatus, type Prisma } from '@prisma/client';

const walletRegex = /^0x[a-fA-F0-9]{40}$/;
const PROFILE_PROMPT_COOLDOWN_DAYS = 7;

export const userRouter = createTRPCRouter({
  /**
   * Get or generate user nonce for signature verification
   */
  getNonce: publicProcedure
    .input(
      z.object({
        walletAddress: z
          .string()
          .regex(walletRegex, 'Invalid wallet address format'),
      }),
    )
    .query(async ({ input }) => {
      const { walletAddress } = input;

      // Find existing user
      let user = await db.user.findUnique({
        where: {
          walletAddress: walletAddress.toLowerCase(),
          deletedAt: null,
        },
        select: {
          id: true,
          walletAddress: true,
          nonce: true,
        },
      });

      let nonce: string;

      if (user && user.nonce) {
        // User exists and has nonce, return directly
        nonce = user.nonce;
      } else {
        // Generate new nonce
        nonce = generateNonce();

        if (user) {
          // User exists but no nonce, update nonce
          await db.user.update({
            where: { id: user.id },
            data: { nonce },
          });
        } else {
          // User doesn't exist, create new user
          user = await db.user.create({
            data: {
              walletAddress: walletAddress.toLowerCase(),
              nonce,
            },
            select: {
              id: true,
              walletAddress: true,
              nonce: true,
            },
          });
        }
      }

      return {
        nonce,
        message: generateLoginMessage(walletAddress, nonce),
      };
    }),

  /**
   * Verify signature and perform user authentication
   */
  authenticate: publicProcedure
    .input(
      z.object({
        walletAddress: z
          .string()
          .regex(walletRegex, 'Invalid wallet address format'),
        signature: z.string().min(1, 'Signature is required'),
        message: z.string().min(1, 'Message is required'),
      }),
    )
    .mutation(async ({ input }) => {
      const { walletAddress, signature, message } = input;

      // Verify signature
      if (!verifySignature(message, signature, walletAddress)) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid signature',
        });
      }

      // Find user
      const user = await db.user.findUnique({
        where: {
          walletAddress: walletAddress.toLowerCase(),
          deletedAt: null,
        },
        select: {
          id: true,
          walletAddress: true,
          ensName: true,
          name: true,
          avatar: true,
          nonce: true,
        },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found. Please get nonce first.',
        });
      }

      // Verify message contains correct nonce (optional additional security check)
      if (user.nonce && !message.includes(user.nonce)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid nonce in message',
        });
      }

      // Generate new nonce for next authentication
      const newNonce = generateNonce();
      await db.user.update({
        where: { id: user.id },
        data: { nonce: newNonce },
      });

      // Generate JWT token
      const token = generateJWT(user.id, user.walletAddress);

      // Build authentication session
      const session: AuthSession = {
        user: {
          id: user.id,
          walletAddress: user.walletAddress,
          ensName: user.ensName,
          name: user.name,
          avatar: user.avatar,
        },
        token,
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days expiration
      };

      return {
        success: true,
        session,
        message: 'Authentication successful',
      };
    }),

  /**
   * Get current user information (authentication required)
   */
  getMe: protectedProcedure.query(async ({ ctx }) => {
    return {
      user: (ctx as any).user,
    };
  }),

  /**
   * Update user profile (authentication required)
   */
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100).optional(),
        bio: z.string().max(500).optional(),
        avatar: z.string().url().optional(),
        links: z.record(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx as any).user.id;

      const existingUser = await db.user.findUnique({
        where: { id: userId, deletedAt: null },
        select: {
          id: true,
          walletAddress: true,
          ensName: true,
          name: true,
          avatar: true,
          bio: true,
          links: true,
          profileCompletedAt: true,
          profilePromptDismissedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!existingUser) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not found',
        });
      }

      const finalName =
        input.name !== undefined ? input.name : existingUser.name;
      const finalAvatar =
        input.avatar !== undefined ? input.avatar : existingUser.avatar;

      const hasDisplayName =
        (finalName && finalName.trim().length > 0) || !!existingUser.ensName;
      const hasAvatar = !!finalAvatar;
      const isCompleted = hasDisplayName && hasAvatar;

      const updateData: Prisma.UserUpdateInput = {
        name: input.name,
        bio: input.bio,
        avatar: input.avatar,
        links: input.links,
        updatedAt: new Date(),
      };

      if (isCompleted) {
        updateData.profileCompletedAt =
          existingUser.profileCompletedAt ?? new Date();
        updateData.profilePromptDismissedAt = null;
      } else {
        updateData.profileCompletedAt = null;
        updateData.profilePromptDismissedAt = null;
      }

      const updatedUser = await db.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          walletAddress: true,
          ensName: true,
          name: true,
          avatar: true,
          bio: true,
          links: true,
          createdAt: true,
          updatedAt: true,
          profileCompletedAt: true,
          profilePromptDismissedAt: true,
        },
      });

      return {
        success: true,
        user: updatedUser,
      };
    }),

  getProfileCompletionStatus: protectedProcedure.query(
    async ({ ctx }: { ctx: any }) => {
      const user = await db.user.findUnique({
        where: { id: ctx.user?.id, deletedAt: null },
        select: {
          id: true,
          walletAddress: true,
          ensName: true,
          name: true,
          avatar: true,
          bio: true,
          links: true,
          profileCompletedAt: true,
          profilePromptDismissedAt: true,
        },
      });

      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not found',
        });
      }

      const hasDisplayName =
        (user.name && user.name.trim().length > 0) || !!user.ensName;
      const hasAvatar = !!user.avatar;
      const isCompleted = hasDisplayName && hasAvatar;

      const requiredFields: Array<'name' | 'avatar'> = [];
      if (!hasDisplayName) requiredFields.push('name');
      if (!hasAvatar) requiredFields.push('avatar');

      const cooldownBoundary = new Date();
      cooldownBoundary.setDate(
        cooldownBoundary.getDate() - PROFILE_PROMPT_COOLDOWN_DAYS,
      );

      const shouldPrompt =
        !isCompleted &&
        (!user.profilePromptDismissedAt ||
          user.profilePromptDismissedAt < cooldownBoundary);

      return {
        isCompleted,
        shouldPrompt,
        requiredFields,
        user,
      };
    },
  ),

  dismissProfilePrompt: protectedProcedure.mutation(
    async ({ ctx }: { ctx: any }) => {
      await db.user.update({
        where: { id: ctx.user?.id },
        data: {
          profilePromptDismissedAt: new Date(),
        },
      });

      return { success: true };
    },
  ),

  getPublicProfile: publicProcedure
    .input(
      z.object({
        addressOrEns: z.string().min(1, 'Address or ENS is required'),
      }),
    )
    .query(async ({ input }) => {
      const searchValue = input.addressOrEns.trim();
      const isAddress = walletRegex.test(searchValue.toLowerCase());

      const user = await db.user.findFirst({
        where: {
          deletedAt: null,
          ...(isAddress
            ? { walletAddress: searchValue.toLowerCase() }
            : {
                ensName: {
                  equals: searchValue,
                  mode: 'insensitive',
                },
              }),
        },
        select: {
          id: true,
          walletAddress: true,
          ensName: true,
          name: true,
          avatar: true,
          bio: true,
          links: true,
          createdAt: true,
        },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      return { user };
    }),

  getProfileStats: publicProcedure
    .input(
      z.object({
        userId: z.string().cuid(),
        windowDays: z.number().min(1).max(365).default(365),
      }),
    )
    .query(async ({ input }) => {
      const windowStart = new Date();
      windowStart.setDate(windowStart.getDate() - input.windowDays);

      const contributions = await db.contribution.findMany({
        where: {
          deletedAt: null,
          createdAt: {
            gte: windowStart,
          },
          contributors: {
            some: {
              contributorId: input.userId,
              deletedAt: null,
            },
          },
        },
        select: {
          id: true,
          status: true,
          projectId: true,
          createdAt: true,
          project: {
            select: {
              id: true,
              key: true,
              name: true,
              description: true,
              logo: true,
            },
          },
        },
      });

      const totals = contributions.reduce(
        (acc, contribution) => {
          acc.contributions += 1;
          if (contribution.status === 'PASSED') acc.passed += 1;
          if (contribution.status === 'FAILED') acc.failed += 1;
          if (contribution.status === 'VALIDATING') acc.validating += 1;
          acc.projects.add(contribution.projectId);
          return acc;
        },
        {
          contributions: 0,
          passed: 0,
          failed: 0,
          validating: 0,
          projects: new Set<string>(),
        },
      );

      const projectMap = new Map<
        string,
        {
          project: {
            id: string;
            key: string;
            name: string;
            description: string | null;
            logo: string | null;
          };
          contributions: number;
          lastContributionAt: Date;
        }
      >();

      contributions.forEach((contribution) => {
        const project = contribution.project;
        if (!project) return;

        if (!projectMap.has(project.id)) {
          projectMap.set(project.id, {
            project,
            contributions: 1,
            lastContributionAt: contribution.createdAt,
          });
        } else {
          const projectStats = projectMap.get(project.id)!;
          projectStats.contributions += 1;
          if (contribution.createdAt > projectStats.lastContributionAt) {
            projectStats.lastContributionAt = contribution.createdAt;
          }
        }
      });

      const activeProjects = Array.from(projectMap.values())
        .sort(
          (a, b) =>
            b.lastContributionAt.getTime() - a.lastContributionAt.getTime(),
        )
        .slice(0, 9)
        .map((item) => ({
          id: item.project.id,
          key: item.project.key,
          name: item.project.name,
          description: item.project.description,
          logo: item.project.logo,
          contributions: item.contributions,
          lastContributionAt: item.lastContributionAt,
        }));

      return {
        totals: {
          contributions: totals.contributions,
          passed: totals.passed,
          failed: totals.failed,
          validating: totals.validating,
          projects: totals.projects.size,
        },
        activeProjects,
      };
    }),

  // Get user's project memberships
  getProjectMemberships: protectedProcedure
    .query(async ({ ctx }: { ctx: any }) => {
      const userId = ctx.user?.id;
      
      const memberships = await db.projectMember.findMany({
        where: {
          userId,
          deletedAt: null,
          project: {
            deletedAt: null,
            status: ProjectStatus.ACTIVE,
          },
        },
        select: {
          projectId: true,
          role: true,
          project: {
            select: {
              id: true,
              key: true,
              name: true,
            },
          },
        },
      });

      return memberships;
    }),
});
