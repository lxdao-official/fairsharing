import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { userRouter } from './user';
import { uploadRouter } from './upload';
import { projectRouter } from './project';
import { contributionRouter } from './contribution';
import { voteRouter } from './vote';

export const appRouter = createTRPCRouter({
  // User authentication and profile management
  user: userRouter,

  // File upload management
  upload: uploadRouter,

  // Project management
  project: projectRouter,

  // Contribution management
  contribution: contributionRouter,

  // Vote management
  vote: voteRouter,

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
