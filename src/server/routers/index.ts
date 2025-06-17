import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { userRouter } from './user';

export const appRouter = router({
  // User authentication and profile management
  user: userRouter,

  // Legacy demo endpoints (can be removed later)
  hello: publicProcedure
    .input(z.object({ name: z.string().optional() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.name ?? 'World'}!`,
        timestamp: new Date().toISOString(),
      };
    }),

  getProjects: publicProcedure.query(() => {
    return [
      { id: 1, name: 'FairSharing', description: 'A fair sharing platform' },
      { id: 2, name: 'Demo Project', description: 'A demo project' },
    ];
  }),

  createProject: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().min(1),
      }),
    )
    .mutation(({ input }) => {
      return {
        id: Math.floor(Math.random() * 1000),
        name: input.name,
        description: input.description,
        createdAt: new Date().toISOString(),
      };
    }),
});

export type AppRouter = typeof appRouter;
