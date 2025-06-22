import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server/routers';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: ({ req }: { req: Request }) => ({
      req,
    }),
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
