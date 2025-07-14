'use client';

import {
  AppShell,
  Container,
  Title,
  Text,
  Group,
  Select,
  SimpleGrid,
  Pagination,
  Stack,
  Center,
  Button,
} from '@mantine/core';
import { Header } from '../../components/Header';
import { Footer } from '@/components/Footer';
import { SearchBar } from '../../components/SearchBar';
import { ProjectCard } from '../../components/ProjectCard';
import { useState, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { trpc } from '@/utils/trpc';
import { useDebounce } from '@/hooks/useDebounce';
import { useAuth } from '@/hooks/useAuth';

// Define sort options mapping
const sortOptions = {
  Popularity: 'popularity',
  Recent: 'recent',
  Contributions: 'contributions',
  'Pie Bakers': 'members',
} as const;

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      variant="subtle"
      style={{
        fontWeight: 700,
        fontSize: 32,
        color: active ? '#000' : '#A0A7B4',
        borderBottom: '3px solid transparent',
        borderBottomColor: active ? '#000' : 'transparent',
        borderRadius: 0,
        padding: 0,
        backgroundColor: 'transparent',
        lineHeight: 1.2,
        height: 'auto',
        '&:hover': {
          backgroundColor: 'transparent',
          color: '#000',
        },
      }}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

export default function AppPage() {
  const [searchValue, setSearchValue] = useState('');
  const [sortBy, setSortBy] = useState('Popularity');
  const [currentPage, setCurrentPage] = useState(1);
  const [tab, setTab] = useState<'my' | 'following' | 'all'>('all');
  const { isConnected } = useAccount();
  const { isAuthenticated, user } = useAuth();

  // Debounce search input
  const debouncedSearch = useDebounce(searchValue, 300);

  // TRPC query for projects
  const {
    data: projectData,
    isLoading,
    error,
    refetch,
  } = trpc.project.list.useQuery({
    filter: tab,
    search: debouncedSearch || undefined,
    sortBy: sortOptions[sortBy as keyof typeof sortOptions],
    page: currentPage,
    limit: 12,
  }) as any;

  const projects = projectData?.projects || [];
  const pagination = projectData?.pagination;

  // Reset page when dependencies change
  useMemo(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [tab, debouncedSearch, sortBy]);

  // Format numbers for display
  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  // Get counts for tabs
  const getTabCounts = () => {
    if (tab === 'my') {
      return {
        my: pagination?.total || 0,
        following: 0, // Could be fetched separately
        all: 0, // Would need separate query
      };
    } else if (tab === 'following') {
      return {
        my: 0, // Would need separate query
        following: pagination?.total || 0,
        all: 0, // Would need separate query
      };
    } else {
      return {
        my: 0, // Would need separate query
        following: 0, // Would need separate query
        all: pagination?.total || 0,
      };
    }
  };

  const tabCounts = getTabCounts();

  return (
    <AppShell header={{ height: 64 }} padding="md">
      <AppShell.Header>
        <Header />
      </AppShell.Header>

      <AppShell.Main>
        <Container size="xl" style={{ maxWidth: 1280 }}>
          <Stack gap="xl" py="xl">
            {/* Hero Section */}
            <Center>
              <Stack gap="lg" align="center">
                <Title
                  order={1}
                  size={64}
                  fw={900}
                  ta="center"
                  style={{
                    letterSpacing: '-0.02em',
                    lineHeight: 1.1,
                  }}
                >
                  <Text
                    component="span"
                    inherit
                    style={{
                      background: 'linear-gradient(45deg, #000 0%, #333 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    GROWING PIES
                  </Text>
                  <br />
                  <Text
                    component="span"
                    inherit
                    style={{
                      background: 'linear-gradient(45deg, #666 0%, #000 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      WebkitTextStroke: '1px transparent',
                      color: 'transparent',
                      textShadow: '0 0 0 #666',
                    }}
                  >
                    with
                  </Text>{' '}
                  <Text
                    component="span"
                    inherit
                    style={{
                      background: 'linear-gradient(45deg, #000 0%, #333 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    FairSharing
                  </Text>
                </Title>

                <div style={{ width: '100%', maxWidth: 500 }}>
                  <SearchBar
                    placeholder="find a pie"
                    value={searchValue}
                    onChange={setSearchValue}
                  />
                </div>
              </Stack>
            </Center>

            {/* Projects Section */}
            <Stack gap="lg">
              <Group justify="space-between" align="center">
                {isConnected ? (
                  <Group gap={32}>
                    <TabButton
                      active={tab === 'my'}
                      onClick={() => setTab('my')}
                    >
                      My Pie ({tabCounts.my})
                    </TabButton>
                    <TabButton
                      active={tab === 'following'}
                      onClick={() => setTab('following')}
                    >
                      Following
                    </TabButton>
                    <TabButton
                      active={tab === 'all'}
                      onClick={() => setTab('all')}
                    >
                      All Projects ({tabCounts.all})
                    </TabButton>
                  </Group>
                ) : (
                  <TabButton
                    active={tab === 'all'}
                    onClick={() => setTab('all')}
                  >
                    All Projects ({tabCounts.all})
                  </TabButton>
                )}
                <Group gap="sm">
                  <Text size="sm" c="dimmed">
                    Sort By
                  </Text>
                  <Select
                    radius="md"
                    value={sortBy}
                    onChange={(value) => setSortBy(value || 'Popularity')}
                    data={[
                      'Popularity',
                      'Recent',
                      'Contributions',
                      'Pie Bakers',
                    ]}
                    size="sm"
                    variant="filled"
                    styles={{
                      input: {
                        border: 'none',
                        backgroundColor: '#f8f9fa',
                      },
                    }}
                  />
                </Group>
              </Group>

              {/* Project Grid */}
              {isLoading ? (
                <SimpleGrid
                  cols={{ base: 1, sm: 2, md: 3, lg: 4 }}
                  spacing="lg"
                >
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-80 bg-gray-100 rounded-xl animate-pulse"
                    />
                  ))}
                </SimpleGrid>
              ) : error ? (
                <div className="text-center py-8">
                  <Text c="red">Failed to load projects</Text>
                  <Button onClick={() => refetch()} mt="md">
                    Try Again
                  </Button>
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-8">
                  {tab === 'my' && !isAuthenticated ? (
                    <Stack gap="md" align="center">
                      <Text size="lg" fw={600}>Please connect your wallet to see your projects</Text>
                      <Text c="dimmed">You need to sign in to view your owned and contributed projects</Text>
                    </Stack>
                  ) : tab === 'my' ? (
                    <Stack gap="md" align="center">
                      <Text size="lg" fw={600}>You haven't created any projects yet</Text>
                      <Text c="dimmed">Start your first project and grow your pie together!</Text>
                      <Button 
                        component="a" 
                        href="/app/create"
                        variant="filled"
                        color="blue"
                      >
                        Create Your First Project
                      </Button>
                    </Stack>
                  ) : (
                    <Text c="dimmed">No projects found</Text>
                  )}
                </div>
              ) : (
                <SimpleGrid
                  cols={{ base: 1, sm: 2, md: 3, lg: 4 }}
                  spacing="lg"
                >
                  {projects.map((project: any) => (
                    <ProjectCard
                      key={project.id}
                      id={project.key}
                      title={project.name}
                      description={project.description}
                      logo={project.logo || undefined}
                      contributions={formatNumber(project._count.contributions)}
                      pieBakers={formatNumber(project._count.members)}
                      isFollowed={project.isFollowed}
                      onFollow={() => {
                        // Refetch the data to update counts and follow status
                        refetch();
                      }}
                      onClick={() =>
                        console.log(`Click project ${project.key}`)
                      }
                    />
                  ))}
                </SimpleGrid>
              )}

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <Center mt="xl">
                  <Group gap="xs">
                    <Text size="sm" c="dimmed">
                      {(currentPage - 1) * pagination.limit + 1}-
                      {Math.min(
                        currentPage * pagination.limit,
                        pagination.total,
                      )}{' '}
                      of {pagination.total}
                    </Text>
                    <Pagination
                      value={currentPage}
                      onChange={setCurrentPage}
                      total={pagination.totalPages}
                      size="sm"
                      styles={{
                        control: {
                          '&[data-active]': {
                            backgroundColor: '#000',
                            color: '#fff',
                            border: '1px solid #000',
                          },
                        },
                      }}
                    />
                  </Group>
                </Center>
              )}
            </Stack>
          </Stack>
        </Container>
      </AppShell.Main>

      <AppShell.Footer style={{ position: 'static' }}>
        <Footer />
      </AppShell.Footer>
    </AppShell>
  );
}
