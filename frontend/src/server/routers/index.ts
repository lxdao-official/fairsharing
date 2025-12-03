import { createTRPCRouter } from '../trpc';
import { userRouter } from './user';
import { uploadRouter } from './upload';
import { projectRouter } from './project';
import { contributionRouter } from './contribution';
import { voteRouter } from './vote';
import { contributorRouter } from './contributor';

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

  // Contributor statistics and analytics
  contributor: contributorRouter,
});

export type AppRouter = typeof appRouter;
