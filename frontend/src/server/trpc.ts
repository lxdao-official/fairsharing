import { initTRPC } from '@trpc/server';
import superjson from 'superjson';

// Define the base context type
export interface Context {
  req?: Request;
  // Optionally include user/session so public procedures can read ctx.user?.id safely
  user?: {
    id: string;
    walletAddress: string;
    ensName: string | null;
    name: string | null;
    avatar: string | null;
    bio: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  session?: {
    userId: string;
    walletAddress: string;
  };
}

// Define the authenticated context type (extended by middleware)
export interface AuthenticatedContext extends Context {
  user: NonNullable<Context['user']>;
  session: NonNullable<Context['session']>;
}

const t = initTRPC.context<Context>().create({
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
