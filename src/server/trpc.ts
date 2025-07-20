import { initTRPC } from '@trpc/server';
import superjson from 'superjson';

const t = initTRPC.context<any>().create({
  transformer: superjson,
  errorFormatter: ({ shape, error }) => {
    return {
      ...shape,
      data: {
        ...shape.data,
        // In production, don't include stack traces
        ...(process.env.NODE_ENV === 'production'
          ? {}
          : { stack: error.stack }),
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

// Authenticated procedure - will be implemented with middleware
export const authenticatedProcedure = t.procedure;

export { t };
