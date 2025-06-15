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
import { useState } from 'react';
import { useAccount } from 'wagmi';

// Mock data for projects
const mockProjects = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  title: 'LXDAO Working Group',
  description: 'The working group of LXDAO.',
  contributions: '1.2k',
  pieBakers: '100',
  isFollowed: i % 5 === 0, // Some cards are followed
}));

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
  const itemsPerPage = 12;
  const { isConnected } = useAccount();

  const myProjects = mockProjects.filter((p) => p.id % 3 === 0);
  const followingProjects = mockProjects.filter((p) => p.isFollowed);

  let tabProjects = mockProjects;
  if (isConnected) {
    if (tab === 'my') tabProjects = myProjects;
    else if (tab === 'following') tabProjects = followingProjects;
    else if (tab === 'all') tabProjects = mockProjects;
  }

  // Filter and paginate projects
  const filteredProjects = tabProjects.filter(
    (project) =>
      project.title.toLowerCase().includes(searchValue.toLowerCase()) ||
      project.description.toLowerCase().includes(searchValue.toLowerCase())
  );

  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentProjects = filteredProjects.filter(
    (_, index) => index >= startIndex && index < startIndex + itemsPerPage
  );

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
                      My Pie ({myProjects.length})
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
                      All Projects ({filteredProjects.length})
                    </TabButton>
                  </Group>
                ) : (
                  <TabButton
                    active={tab === 'all'}
                    onClick={() => setTab('all')}
                  >
                    All Projects ({filteredProjects.length})
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
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="lg">
                {currentProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    id={project.id.toString()}
                    title={project.title}
                    description={project.description}
                    contributions={project.contributions}
                    pieBakers={project.pieBakers}
                    isFollowed={project.isFollowed}
                    onFollow={() => console.log(`Follow project ${project.id}`)}
                    onClick={() => console.log(`Click project ${project.id}`)}
                  />
                ))}
              </SimpleGrid>

              {/* Pagination */}
              {totalPages > 1 && (
                <Center mt="xl">
                  <Group gap="xs">
                    <Text size="sm" c="dimmed">
                      {startIndex + 1}-
                      {Math.min(
                        startIndex + itemsPerPage,
                        filteredProjects.length
                      )}{' '}
                      of {filteredProjects.length}
                    </Text>
                    <Pagination
                      value={currentPage}
                      onChange={setCurrentPage}
                      total={totalPages}
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
