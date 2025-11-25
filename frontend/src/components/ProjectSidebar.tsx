'use client';

import { Box, Skeleton, Stack, Text, Tooltip } from '@mantine/core';
import { useMemo } from 'react';
import { SidebarIcon } from '@/components/SidebarIcon';
import { IconHome, IconAlertCircle } from '@tabler/icons-react';
import { trpc } from '@/utils/trpc';
import { useAuth } from '@/hooks/useAuth';

interface SidebarProject {
  id: string;
  key: string;
  name: string;
  logo?: string | null;
}

type ContributorProject = SidebarProject & {
  lastContributionAt?: string;
};

interface ProjectSidebarProps {
  currentProject?: string;
  limitOwned?: number;
  limitMember?: number;
  limitContributor?: number;
}

const DEFAULT_LIMIT = {
  owned: 6,
  member: 6,
  contributor: 6,
} as const;

const SIDEBAR_STYLES = {
  container: {
    width: 96,
    backgroundColor: '#fff',
    borderRight: '1px solid #E5E7EB',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    padding: '12px 0',
    top: 64,
  },
  homeIcon: {
    marginBottom: '16px',
  },
} as const;

export function ProjectSidebar({
  currentProject,
  limitOwned = DEFAULT_LIMIT.owned,
  limitMember = DEFAULT_LIMIT.member,
  limitContributor = DEFAULT_LIMIT.contributor,
}: ProjectSidebarProps) {
  const { isAuthenticated } = useAuth();

  const {
    data,
    isLoading,
    isError,
  } = trpc.user.getSidebarProjects.useQuery(
    {
      limitOwned,
      limitMember,
      limitContributor,
    },
    {
      enabled: isAuthenticated,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
  );

  const projects = useMemo(() => {
    const orderedProjects: SidebarProject[] = [];
    const seen = new Set<string>();

    const pushUnique = (project: SidebarProject) => {
      if (!seen.has(project.id)) {
        seen.add(project.id);
        orderedProjects.push(project);
      }
    };

    (data?.owned || []).forEach(pushUnique);
    (data?.member || []).forEach(pushUnique);
    (data?.contributor || []).forEach((project: ContributorProject) =>
      pushUnique({
        id: project.id,
        key: project.key,
        name: project.name,
        logo: project.logo,
      }),
    );

    return orderedProjects;
  }, [data]);

  const shouldShowProjects =
    isAuthenticated &&
    !isError &&
    (isLoading || projects.length > 0);

  const skeletonPlaceholders = useMemo(
    () => Array.from({ length: 3 }),
    [],
  );

  return (
    <Box style={SIDEBAR_STYLES.container}>
      <Box style={SIDEBAR_STYLES.homeIcon}>
        <SidebarIcon href="/" ariaLabel="Go to home page">
          <IconHome size={24} color="#000000" />
        </SidebarIcon>
      </Box>

      {isError && isAuthenticated && (
        <Stack gap={8} align="center" px={8}>
          <IconAlertCircle size={32} color="#DC2626" />
          <Text size="xs" c="dimmed" ta="center">
            Failed to load projects
          </Text>
        </Stack>
      )}

      {shouldShowProjects &&
        (isLoading && !data ? (
          <Stack gap={12} align="center" px={8}>
            {skeletonPlaceholders.map((_, idx) => (
              <Skeleton key={`sidebar-skeleton-${idx}`} height={56} width={56} radius="50%" />
            ))}
          </Stack>
        ) : (
          <Stack gap={12} align="center" px={8}>
            {projects.map((project) => {
              const label = project.name?.trim() || 'P';
              const initial = label.charAt(0).toUpperCase();
              const avatar = project.logo && project.logo.trim().length > 0 ? project.logo : undefined;

              return (
                <Tooltip
                  key={project.id}
                  label={project.name}
                  position="right"
                  withArrow
                  openDelay={200}
                >
                  <SidebarIcon
                    href={`/project/${project.key}`}
                    isActive={project.key === currentProject}
                    avatar={avatar}
                    ariaLabel={`Go to ${project.name} project`}
                  >
                    {!avatar && (
                      <Text fw={700} size="sm" c="#0F172A">
                        {initial}
                      </Text>
                    )}
                  </SidebarIcon>
                </Tooltip>
              );
            })}
          </Stack>
        ))}
    </Box>
  );
}
