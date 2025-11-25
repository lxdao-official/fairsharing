'use client';

import {
  Container,
  Stack,
  Title,
  Text,
  Avatar,
  Group,
  Box,
  ActionIcon,
  Anchor,
  SimpleGrid,
  Tooltip,
  Tabs,
  Pagination,
  Alert,
  Button,
} from '@mantine/core';
import {
  IconBrandTwitter,
  IconBrandGithub,
  IconBrandLinkedin,
  IconBrandTelegram,
  IconLink,
  IconCopy,
  IconInfoCircle,
} from '@tabler/icons-react';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Layout } from '@/components/Layout';
import { ProjectCard } from '@/components/ProjectCard';
import { ContributionCard } from '@/components/ContributionCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { trpc } from '@/utils/trpc';
import {
  ProfileCompletionModal,
  type ProfileUser,
} from '@/components/ProfileCompletionModal';
import { useAuth } from '@/hooks/useAuth';
import { subscribeToProfileUpdates } from '@/utils/profileEvents';

type ContributionTab = 'all' | 'validating' | 'on-chain' | 'failed';

const contributionStatusMap: Record<
  ContributionTab,
  'VALIDATING' | 'FAILED' | 'ON_CHAIN' | undefined
> = {
  all: undefined,
  validating: 'VALIDATING',
  'on-chain': 'ON_CHAIN',
  failed: 'FAILED',
};

const linkIconMap: Record<string, typeof IconLink> = {
  twitter: IconBrandTwitter,
  github: IconBrandGithub,
  linkedin: IconBrandLinkedin,
  telegram: IconBrandTelegram,
  website: IconLink,
};

type UpdatedUserPayload = ProfileUser;

function shortenAddress(address?: string) {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function UserPage() {
  const params = useParams<{ address: string }>();
  const identifier = params?.address ? decodeURIComponent(params.address) : '';
  const [activeContributionTab, setActiveContributionTab] =
    useState<ContributionTab>('all');
  const [currentContributionPage, setCurrentContributionPage] = useState(1);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const itemsPerPage = 6;
  const { session, setSession } = useAuth();
  const router = useRouter();
  const utils = trpc.useUtils();

  useEffect(() => {
    setCurrentContributionPage(1);
  }, [activeContributionTab]);

  const {
    data: profileData,
    isLoading: isProfileLoading,
    error: profileError,
  } = trpc.user.getPublicProfile.useQuery(
    { addressOrEns: identifier },
    { enabled: !!identifier },
  );

  const userId = profileData?.user.id ?? '';

  const {
    data: statsData,
    isLoading: statsLoading,
    error: statsError,
  } = trpc.user.getProfileStats.useQuery(
    { userId },
    { enabled: !!userId },
  );

  const {
    data: contributionsData,
    isLoading: contributionsLoading,
    error: contributionsError,
  } = trpc.contribution.listByContributor.useQuery(
    {
      contributorId: userId,
      status: contributionStatusMap[activeContributionTab],
      page: currentContributionPage,
      limit: itemsPerPage,
    },
    {
      enabled: !!userId,
      keepPreviousData: true,
    },
  );

  const user = profileData?.user;
  const displayName =
    user?.name || user?.ensName || shortenAddress(user?.walletAddress);

  const socialLinks = useMemo(() => {
    if (!user?.links) return [];
    return Object.entries(user.links).filter(([, url]) => !!url);
  }, [user?.links]);

  const activeProjects = statsData?.activeProjects ?? [];
  const totals = statsData?.totals;
  const totalContributions = totals?.contributions ?? 0;
  const contributionsList = useMemo(
    () => contributionsData?.contributions ?? [],
    [contributionsData?.contributions],
  );
  const pagination = contributionsData?.pagination;

  const normalizedContributions = useMemo(
    () =>
      contributionsList.map((contribution) => ({
        ...contribution,
        startAt: contribution.startAt
          ? new Date(contribution.startAt)
          : null,
        endAt: contribution.endAt ? new Date(contribution.endAt) : null,
        createdAt: new Date(contribution.createdAt),
        updatedAt: new Date(contribution.updatedAt),
      })),
    [contributionsList],
  );

  const canEditProfile = Boolean(user && session?.user?.id === user.id);

  const updateCachedProfile = useCallback(
    (nextUser: UpdatedUserPayload) => {
      const identifiers = Array.from(
        new Set(
          [
            identifier,
            nextUser.walletAddress,
            nextUser.ensName ?? undefined,
          ].filter(
            (value): value is string =>
              !!value && value.trim().length > 0,
          ),
        ),
      );

      identifiers.forEach((value) => {
        utils.user.getPublicProfile.setData(
          { addressOrEns: value },
          (previous) =>
            previous
              ? {
                  ...previous,
                  user: {
                    ...previous.user,
                    ...nextUser,
                  },
                }
              : previous,
        );
      });
    },
    [identifier, utils],
  );

  useEffect(() => {
    if (!user?.id) return;
    const unsubscribe = subscribeToProfileUpdates(({ user: updatedUser }) => {
      if (updatedUser.id !== user.id) return;
      updateCachedProfile(updatedUser);

      const invalidations: Array<Promise<unknown>> = [
        utils.user.getPublicProfile.invalidate({ addressOrEns: updatedUser.walletAddress }),
        utils.user.getPublicProfile.invalidate(),
      ];

      if (updatedUser.ensName) {
        invalidations.push(
          utils.user.getPublicProfile.invalidate({
            addressOrEns: updatedUser.ensName,
          }),
        );
      }

      if (identifier) {
        invalidations.push(
          utils.user.getPublicProfile.invalidate({
            addressOrEns: identifier,
          }),
        );
      }

      if (userId) {
        invalidations.push(
          utils.user.getProfileStats.invalidate({ userId }),
        );
      }

      Promise.all(invalidations).catch((error) => {
        console.error('Failed to refresh profile after broadcast', error);
      });
    });
    return unsubscribe;
  }, [identifier, updateCachedProfile, user?.id, userId, utils]);

  if (!identifier) {
    return (
      <Layout>
        <Container size="md" py={80}>
          <Alert color="red" icon={<IconInfoCircle size={16} />}>
            Invalid profile identifier.
          </Alert>
        </Container>
      </Layout>
    );
  }

  if (isProfileLoading) {
    return (
      <Layout>
        <Container size="md" py={80}>
          <LoadingSpinner text="Loading profile..." />
        </Container>
      </Layout>
    );
  }

  if (profileError) {
    return (
      <Layout>
        <Container size="md" py={80}>
          <Alert color="red" icon={<IconInfoCircle size={16} />}>
            {profileError.message}
          </Alert>
        </Container>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <Container size="md" py={80}>
          <Alert color="yellow" icon={<IconInfoCircle size={16} />}>
            We couldn&apos;t find that contributor.
          </Alert>
        </Container>
      </Layout>
    );
  }

  const handleProfileUpdated = (updatedUser: UpdatedUserPayload) => {
    if (!session) return;
    setSession({
      ...session,
      user: {
        ...session.user,
        name: updatedUser.name ?? session.user.name,
        avatar: updatedUser.avatar ?? session.user.avatar,
      },
    });
    updateCachedProfile(updatedUser);

    const invalidations: Array<Promise<unknown>> = [];

    if (identifier) {
      invalidations.push(
        utils.user.getPublicProfile.invalidate({
          addressOrEns: identifier,
        }),
      );
    }

    invalidations.push(
      utils.user.getPublicProfile.invalidate({
        addressOrEns: updatedUser.walletAddress,
      }),
      utils.user.getPublicProfile.invalidate(),
    );

    if (updatedUser.ensName) {
      invalidations.push(
        utils.user.getPublicProfile.invalidate({
          addressOrEns: updatedUser.ensName,
        }),
      );
    }

    if (userId) {
      invalidations.push(
        utils.user.getProfileStats.invalidate({ userId }),
      );
    }

    Promise.all(invalidations).catch((error) =>
      console.error('Failed to refresh profile after edit', error),
    );

    router.refresh();
  };

  return (
    <Layout>
      <Container size="xl" py={40}>
        <Group gap={80} align="flex-start" style={{ width: '100%' }}>
          <Box style={{ width: 260, flexShrink: 0 }}>
            <Stack gap={32}>
              <Avatar
                src={user.avatar || undefined}
                size={200}
                radius="50%"
                style={{
                  border: '2px solid #f0f0f0',
                  display: 'block',
                  margin: '0 auto',
                }}
              >
                {!user.avatar && displayName.slice(0, 2).toUpperCase()}
              </Avatar>

              {user.bio && (
                <Box>
                  <Text size="sm" c="dark.7" style={{ lineHeight: 1.6 }}>
                    {user.bio}
                  </Text>
                </Box>
              )}

              {socialLinks.length > 0 && (
                <Stack gap={8}>
                  {socialLinks.map(([key, url]) => {
                    const IconComponent = linkIconMap[key] ?? IconLink;
                    return (
                      <Group key={key} gap={8} align="center">
                        <IconComponent size={16} color="#666" />
                        <Anchor
                          href={url}
                          target="_blank"
                          size="sm"
                          c="dark.6"
                          td="none"
                        >
                          {url}
                        </Anchor>
                      </Group>
                    );
                  })}
                </Stack>
              )}

              {activeProjects.length > 0 && (
                <Stack
                  gap={16}
                  style={{ borderTop: '1px solid #DEE2E6' }}
                  pt={24}
                >
                  <Title order={3} size={18} fw={600}>
                    Recent Pies
                  </Title>
                  <Box>
                    <SimpleGrid cols={4} spacing={12}>
                      {activeProjects.slice(0, 12).map((project) => (
                        <Tooltip
                          key={project.id}
                          label={project.name}
                          position="top"
                          withArrow
                        >
                          <Box
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              position: 'relative',
                              cursor: 'pointer',
                              overflow: 'hidden',
                              border: '1px solid #e9ecef',
                            }}
                          >
                            <Avatar
                              src={project.logo || undefined}
                              size={48}
                              radius="md"
                            >
                              {!project.logo && project.name.charAt(0)}
                            </Avatar>
                          </Box>
                        </Tooltip>
                      ))}
                    </SimpleGrid>
                  </Box>
                </Stack>
              )}
            </Stack>
          </Box>

          <Box style={{ flex: 1 }}>
            <Stack gap={32}>
              <Box mt={24}>
                <Stack gap={24}>
                  <Group justify="space-between" align="flex-start">
                    <Stack gap={8}>
                      <Title order={1} size={32} fw={700}>
                        {displayName}
                      </Title>
                      <Group gap={8}>
                        <Text size="sm" c="gray.6" ff="monospace">
                          {shortenAddress(user.walletAddress)}
                        </Text>
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          size="xs"
                          onClick={() =>
                            navigator.clipboard.writeText(user.walletAddress)
                          }
                        >
                          <IconCopy size={12} />
                        </ActionIcon>
                      </Group>
                    </Stack>
                    {canEditProfile && (
                      <Button
                        variant="light"
                        size="sm"
                        onClick={() => setIsEditModalOpen(true)}
                      >
                        Edit profile
                      </Button>
                    )}
                  </Group>

                  <Group gap={32} wrap="wrap" justify="flex-start">
                    <Stack gap={4}>
                      <Text size="sm" c="gray.6" fw={700}>
                        Contributions
                      </Text>
                      <Text size="lg" fw={700} c="dark">
                        {totals ? totals.contributions.toLocaleString() : '—'}
                      </Text>
                    </Stack>
                    <Stack gap={4}>
                      <Text size="sm" c="gray.6" fw={700}>
                        Active Pies
                      </Text>
                      <Text size="lg" fw={700} c="dark">
                        {totals ? totals.projects.toLocaleString() : '—'}
                      </Text>
                    </Stack>
                    <Stack gap={4}>
                      <Text size="sm" c="gray.6" fw={700}>
                        Passed
                      </Text>
                      <Text size="lg" fw={700} c="dark">
                        {totals ? totals.passed.toLocaleString() : '—'}
                      </Text>
                    </Stack>
                    <Stack gap={4}>
                      <Text size="sm" c="gray.6" fw={700}>
                        Validating
                      </Text>
                      <Text size="lg" fw={700} c="dark">
                        {totals ? totals.validating.toLocaleString() : '—'}
                      </Text>
                    </Stack>
                  </Group>
                </Stack>
              </Box>

              <Stack gap={16}>
                <Group justify="space-between">
                  <Title order={2} size={28} fw={600}>
                    Active in Making{' '}
                    {activeProjects.length.toString()} Pies in the Last Year
                  </Title>
                </Group>

                {statsError && (
                  <Alert color="red" icon={<IconInfoCircle size={16} />}>
                    Failed to load stats: {statsError.message}
                  </Alert>
                )}

                {statsLoading && (
                  <LoadingSpinner text="Loading active projects..." />
                )}

                {!statsLoading && activeProjects.length === 0 && (
                  <Alert color="gray" icon={<IconInfoCircle size={16} />}>
                    No recent project activity yet.
                  </Alert>
                )}

                {!statsLoading && activeProjects.length > 0 && (
                  <SimpleGrid cols={3} spacing={24}>
                    {activeProjects.map((project) => (
                      <ProjectCard
                        key={project.id}
                        id={project.key}
                        title={project.name}
                        description={
                          project.description || 'A FairSharing project'
                        }
                        contributions={project.contributions.toString()}
                        pieBakers="—"
                        logo={project.logo || undefined}
                      />
                    ))}
                  </SimpleGrid>
                )}
              </Stack>

              <Stack gap={24} mt={32}>
                <Group justify="space-between" align="baseline">
                  <Group gap={16} align="baseline">
                    <Title order={2} size={28} fw={700}>
                      {totalContributions.toLocaleString()} Contributions in the
                      Last Year
                    </Title>
                  </Group>
                </Group>

                <Tabs
                  value={activeContributionTab}
                  onChange={(value) =>
                    setActiveContributionTab((value as ContributionTab) || 'all')
                  }
                  variant="pills"
                >
                  <Tabs.List>
                    {[
                      { value: 'all', label: 'All' },
                      { value: 'validating', label: 'Validating' },
                      { value: 'on-chain', label: 'On-Chain' },
                      { value: 'failed', label: 'Failed' },
                    ].map((tab) => (
                      <Tabs.Tab
                        key={tab.value}
                        value={tab.value}
                        style={{
                          backgroundColor:
                            activeContributionTab === tab.value
                              ? '#FFDD44'
                              : 'transparent',
                          color: '#000000',
                          borderRadius: '24px',
                          padding: '8px 24px',
                        }}
                      >
                        {tab.label}
                      </Tabs.Tab>
                    ))}
                  </Tabs.List>
                </Tabs>

                <Box
                  style={{
                    backgroundColor: '#F9F9F9',
                    borderRadius: 24,
                    padding: 8,
                  }}
                >
                  {contributionsLoading && (
                    <LoadingSpinner text="Loading contributions..." />
                  )}

                  {contributionsError && (
                    <Alert color="red" icon={<IconInfoCircle size={16} />}>
                      {contributionsError.message}
                    </Alert>
                  )}

                  {!contributionsLoading &&
                    !contributionsError &&
                    contributionsList.length === 0 && (
                      <Box
                        style={{
                          backgroundColor: 'white',
                          borderRadius: 24,
                          padding: 32,
                          textAlign: 'center',
                        }}
                      >
                        <Text size="lg" c="gray.6">
                          No contributions found for this filter.
                        </Text>
                      </Box>
                    )}

                  {!contributionsLoading &&
                    !contributionsError &&
                    normalizedContributions.length > 0 && (
                      <>
                        <SimpleGrid cols={2} spacing={8}>
                          {normalizedContributions.map((contribution) => (
                            <ContributionCard
                              key={contribution.id}
                              contribution={contribution}
                              projectId={contribution.project?.id || ''}
                            />
                          ))}
                        </SimpleGrid>

                        {pagination && pagination.totalPages > 1 && (
                          <Group justify="center" mt={16}>
                            <Pagination
                              value={currentContributionPage}
                              onChange={setCurrentContributionPage}
                              total={pagination.totalPages}
                              size="sm"
                            />
                          </Group>
                        )}
                      </>
                    )}
                </Box>
              </Stack>
            </Stack>
          </Box>
        </Group>
      </Container>

      <ProfileCompletionModal
        opened={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        mode="edit"
        profileIdentifier={identifier}
        user={
          canEditProfile
            ? {
                id: user.id,
                walletAddress: user.walletAddress,
                ensName: user.ensName,
                name: user.name,
                avatar: user.avatar,
                bio: user.bio,
                links: user.links,
              }
            : undefined
        }
        onProfileUpdated={handleProfileUpdated}
      />
    </Layout>
  );
}
