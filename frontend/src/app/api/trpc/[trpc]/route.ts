import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server/routers';
import { verifyJWT, extractBearerToken } from '@/lib/auth';
import { db } from '@/lib/db';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: async ({ req }: { req: Request }) => {
      // Try to get user from token if present
      let user = null;
      try {
        const authHeader = req.headers.get('authorization');
        const token = extractBearerToken(authHeader ?? undefined);

        if (token) {
          const payload = verifyJWT(token);
          if (payload) {
            user = await db.user.findUnique({
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
          }
        }
      } catch (error) {
        // Silently ignore auth errors for public procedures
      }

      return {
        req,
        user,
      };
    },
    onError: ({ path, error }) => {
      // Log errors server-side for debugging
      console.error(`❌ tRPC Error on '${path}':`, error);

      // In production, don't expose sensitive information
      if (process.env.NODE_ENV === 'production') {
        // Only log the basic error info, don't expose stack traces
        console.error('Production tRPC Error:', {
          path,
          code: error.code,
          message: error.message,
        });
      }
    },
  });

export { handler as GET, handler as POST };
