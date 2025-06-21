import { initTRPC } from '@trpc/server';

// Define the base context type
export interface Context {
  req?: any;
  res?: any;
}

// Define the authenticated context type
export interface AuthenticatedContext extends Context {
  user: {
    id: string;
    walletAddress: string;
    ensName: string | null;
    name: string | null;
    avatar: string | null;
    bio: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  session: {
    userId: string;
    walletAddress: string;
  };
}

const t = initTRPC.context<Context>().create();

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

// Authenticated procedure - will be implemented with middleware
export const authenticatedProcedure = t.procedure;

export { t };
