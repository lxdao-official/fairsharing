import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { db } from '@/lib/db';
import { ContributionStatus } from '@prisma/client';

// Input validation schemas
const getContributorsSchema = z.object({
  projectId: z.string().cuid(),
  limit: z.number().min(1).max(100).default(50),
  sortBy: z.enum(['contributions', 'percentage', 'recent', 'name']).default('contributions'),
});

const getContributorStatsSchema = z.object({
  projectId: z.string().cuid(),
  contributorId: z.string().cuid(),
});

export const contributorRouter = createTRPCRouter({
  // Get contributors for a project with statistics
  list: publicProcedure
    .input(getContributorsSchema)
    .query(async ({ input }) => {
      const { projectId, limit, sortBy } = input;

      // Get all contributions for the project
      const contributions = await db.contribution.findMany({
        where: {
          projectId,
          deletedAt: null,
        },
        include: {
          contributors: {
            where: { deletedAt: null },
            include: {
              contributor: {
                select: {
                  id: true,
                  walletAddress: true,
                  ensName: true,
                  name: true,
                  avatar: true,
                },
              },
            },
          },
        },
      });

      // Get project members for role information
      const projectMembers = await db.projectMember.findMany({
        where: {
          projectId,
          deletedAt: null,
        },
        include: {
          user: {
            select: {
              id: true,
              walletAddress: true,
              ensName: true,
              name: true,
              avatar: true,
            },
          },
        },
      });

      // Calculate contributor statistics
      const contributorStats = new Map();

      contributions.forEach((contribution) => {
        contribution.contributors.forEach((contrib) => {
          const userId = contrib.contributor.id;
          
          if (!contributorStats.has(userId)) {
            const member = projectMembers.find(m => m.userId === userId);
            contributorStats.set(userId, {
              user: contrib.contributor,
              role: member?.role || ['CONTRIBUTOR'],
              totalContributions: 0,
              totalHours: 0,
              totalPoints: 0,
              recentActivity: new Date(0),
              passedContributions: 0,
              failedContributions: 0,
              validatingContributions: 0,
            });
          }

          const stats = contributorStats.get(userId);
          stats.totalContributions += 1;
          stats.totalHours += contrib.hours || 0;
          stats.totalPoints += contrib.points || 0;
          
          // Update recent activity
          if (contribution.createdAt > stats.recentActivity) {
            stats.recentActivity = contribution.createdAt;
          }

          // Count by status
          switch (contribution.status) {
            case ContributionStatus.PASSED:
              stats.passedContributions += 1;
              break;
            case ContributionStatus.FAILED:
              stats.failedContributions += 1;
              break;
            case ContributionStatus.VALIDATING:
              stats.validatingContributions += 1;
              break;
          }
        });
      });

      // Calculate total points for percentage calculation
      const totalProjectPoints = Array.from(contributorStats.values())
        .reduce((sum, stats) => sum + stats.totalPoints, 0);

      // Convert to array and add percentage
      const contributors = Array.from(contributorStats.values()).map((stats) => ({
        ...stats,
        percentage: totalProjectPoints > 0 ? (stats.totalPoints / totalProjectPoints) * 100 : 0,
      }));

      // Sort contributors
      contributors.sort((a, b) => {
        switch (sortBy) {
          case 'contributions':
            return b.totalContributions - a.totalContributions;
          case 'percentage':
            return b.percentage - a.percentage;
          case 'recent':
            return b.recentActivity.getTime() - a.recentActivity.getTime();
          case 'name':
            return (a.user.name || a.user.ensName || a.user.walletAddress)
              .localeCompare(b.user.name || b.user.ensName || b.user.walletAddress);
          default:
            return 0;
        }
      });

      return {
        contributors: contributors.slice(0, limit),
        totalContributors: contributors.length,
        totalContributions: contributions.length,
        totalPoints: totalProjectPoints,
      };
    }),

  // Get detailed statistics for a specific contributor
  getStats: publicProcedure
    .input(getContributorStatsSchema)
    .query(async ({ input }) => {
      const { projectId, contributorId } = input;

      // Get contributor's contributions
      const contributions = await db.contribution.findMany({
        where: {
          projectId,
          deletedAt: null,
          contributors: {
            some: {
              contributorId,
              deletedAt: null,
            },
          },
        },
        include: {
          contributors: {
            where: {
              contributorId,
              deletedAt: null,
            },
          },
          votes: {
            where: { deletedAt: null },
            select: { type: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Calculate statistics
      const stats = {
        totalContributions: contributions.length,
        totalHours: 0,
        totalPoints: 0,
        statusBreakdown: {
          VALIDATING: 0,
          PASSED: 0,
          FAILED: 0,
          ON_CHAIN: 0,
        },
        monthlyContributions: new Map(),
        recentContributions: contributions.slice(0, 5).map(c => ({
          id: c.id,
          content: c.content.substring(0, 100) + (c.content.length > 100 ? '...' : ''),
          status: c.status,
          createdAt: c.createdAt,
          hours: c.contributors[0]?.hours || 0,
          points: c.contributors[0]?.points || 0,
          votes: {
            pass: c.votes.filter(v => v.type === 'PASS').length,
            fail: c.votes.filter(v => v.type === 'FAIL').length,
            skip: c.votes.filter(v => v.type === 'SKIP').length,
          },
        })),
      };

      contributions.forEach((contribution) => {
        const contrib = contribution.contributors[0];
        if (contrib) {
          stats.totalHours += contrib.hours || 0;
          stats.totalPoints += contrib.points || 0;
        }

        // Count by status
        stats.statusBreakdown[contribution.status as keyof typeof stats.statusBreakdown] += 1;

        // Group by month for trends
        const monthKey = `${contribution.createdAt.getFullYear()}-${contribution.createdAt.getMonth() + 1}`;
        stats.monthlyContributions.set(
          monthKey,
          (stats.monthlyContributions.get(monthKey) || 0) + 1
        );
      });

      return {
        ...stats,
        monthlyContributions: Array.from(stats.monthlyContributions.entries()).map(([month, count]) => ({
          month,
          count,
        })),
      };
    }),

  // Get project contribution overview
  getProjectOverview: publicProcedure
    .input(z.object({ projectId: z.string().cuid() }))
    .query(async ({ input }) => {
      const { projectId } = input;

      // Get project with basic stats
      const project = await db.project.findUnique({
        where: { id: projectId, deletedAt: null },
        include: {
          _count: {
            select: {
              contributions: { where: { deletedAt: null } },
              members: { where: { deletedAt: null } },
            },
          },
        },
      });

      if (!project) {
        throw new Error('Project not found');
      }

      // Get contribution status breakdown
      const statusCounts = await db.contribution.groupBy({
        by: ['status'],
        where: {
          projectId,
          deletedAt: null,
        },
        _count: {
          id: true,
        },
      });

      // Get monthly contribution trends (last 12 months)
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      const monthlyTrends = await db.contribution.findMany({
        where: {
          projectId,
          deletedAt: null,
          createdAt: {
            gte: twelveMonthsAgo,
          },
        },
        select: {
          createdAt: true,
          status: true,
        },
      });

      // Group by month
      const monthlyStats = new Map();
      monthlyTrends.forEach((contribution) => {
        const monthKey = `${contribution.createdAt.getFullYear()}-${contribution.createdAt.getMonth() + 1}`;
        if (!monthlyStats.has(monthKey)) {
          monthlyStats.set(monthKey, { total: 0, passed: 0, failed: 0, validating: 0 });
        }
        const stats = monthlyStats.get(monthKey);
        stats.total += 1;
        if (contribution.status === 'PASSED') stats.passed += 1;
        else if (contribution.status === 'FAILED') stats.failed += 1;
        else if (contribution.status === 'VALIDATING') stats.validating += 1;
      });

      return {
        project: {
          id: project.id,
          name: project.name,
          totalContributions: project._count.contributions,
          totalMembers: project._count.members,
        },
        statusBreakdown: statusCounts.reduce((acc, item) => {
          acc[item.status] = item._count.id;
          return acc;
        }, {} as Record<string, number>),
        monthlyTrends: Array.from(monthlyStats.entries())
          .map(([month, stats]) => ({ month, ...stats }))
          .sort((a, b) => a.month.localeCompare(b.month)),
      };
    }),
});
