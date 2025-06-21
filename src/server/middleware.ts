import { TRPCError } from '@trpc/server';
import { verifyJWT, extractBearerToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { t, Context, AuthenticatedContext } from './trpc';

/**
 * Authentication middleware - validates JWT token and retrieves user information
 */
export const authMiddleware = t.middleware(
  async ({ ctx, next }: { ctx: Context; next: any }) => {
    // Extract token from request headers (server-side only)
    const token = extractBearerToken(ctx.req?.headers?.authorization);

    if (!token) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'No authentication token provided',
      });
    }

    // Verify JWT token
    const payload = verifyJWT(token);
    if (!payload) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
      });
    }

    // Get complete user information from database
    const user = await db.user.findUnique({
      where: {
        id: payload.userId,
        deletedAt: null,
      },
      select: {
        id: true,
        walletAddress: true,
        ensName: true,
        name: true,
        avatar: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'User not found',
      });
    }

    // Verify token wallet address matches user wallet address
    if (
      user.walletAddress.toLowerCase() !== payload.walletAddress.toLowerCase()
    ) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Token wallet address mismatch',
      });
    }

    return next({
      ctx: {
        ...ctx,
        user,
        session: {
          userId: user.id,
          walletAddress: user.walletAddress,
        },
      } as AuthenticatedContext,
    });
  },
);

/**
 * Create authenticated procedure
 */
export const protectedProcedure = t.procedure.use(authMiddleware);
