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
import { ProjectStatus } from '@prisma/client';

export const userRouter = createTRPCRouter({
  /**
   * Get or generate user nonce for signature verification
   */
  getNonce: publicProcedure
    .input(
      z.object({
        walletAddress: z
          .string()
          .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address format'),
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
          .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address format'),
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
      const updatedUser = await db.user.update({
        where: { id: (ctx as any).user.id },
        data: {
          name: input.name,
          bio: input.bio,
          avatar: input.avatar,
          links: input.links,
          updatedAt: new Date(),
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
          updatedAt: true,
        },
      });

      return {
        success: true,
        user: updatedUser,
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
