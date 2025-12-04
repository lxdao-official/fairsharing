'use client';

import {
  Stack,
  Title,
  Tabs,
  Select,
  Group,
  Pagination,
  Box,
  SimpleGrid,
  Text,
  Alert,
} from '@mantine/core';
import { IconChevronDown, IconInfoCircle } from '@tabler/icons-react';
import { useState, useEffect, useMemo } from 'react';
import { ContributionCard } from './ContributionCard';
import { LoadingSpinner } from './LoadingSpinner';
import { trpc } from '@/utils/trpc';
// import { useDebounce } from '@/hooks/useDebounce';

interface ContributionsSectionProps {
  projectId: string;
}

export function ContributionsSection({ projectId }: ContributionsSectionProps) {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedContributor, setSelectedContributor] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Map status for API
  const statusMap: Record<string, string | undefined> = {
    all: undefined,
    validating: 'VALIDATING',
    'on-chain': 'ON_CHAIN',
  };

  // Fetch contributions
  const {
    data: contributionsData,
    isLoading,
    error,
    // refetch,
  } = trpc.contribution.list.useQuery({
    projectId,
    status: statusMap[activeTab] as any,
    contributorId: selectedContributor || undefined,
    page: currentPage,
    limit: itemsPerPage,
  });

  const filteredContributions = useMemo(() => {
    if (!contributionsData?.contributions) return [];
    return contributionsData.contributions;
  }, [contributionsData?.contributions]);

  // Get unique contributors for the select dropdown
  const contributors = useMemo(() => {
    if (!contributionsData?.contributions) return [];
    
    const uniqueContributors = new Map();
    contributionsData.contributions.forEach(contribution => {
      contribution.contributors.forEach(contributor => {
        const user = contributor.contributor;
        if (!uniqueContributors.has(user.id)) {
          uniqueContributors.set(user.id, {
            value: user.id,
            label: user.name || user.ensName || `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`,
          });
        }
      });
    });
    
    return Array.from(uniqueContributors.values());
  }, [contributionsData?.contributions]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, selectedContributor]);

  if (isLoading) {
    return <LoadingSpinner text="Loading contributions..." />;
  }

  if (error) {
    return (
      <Alert color="red" icon={<IconInfoCircle size={16} />}>
        Failed to load contributions: {error.message}
      </Alert>
    );
  }

  const totalContributions = contributionsData?.pagination.total || 0;
  const pagination = contributionsData?.pagination;

  return (
    <Stack gap={18}>
      {/* Header */}
      <Group justify="space-between" align="baseline">
        <Group gap={16} align="baseline">
          <Title order={2} size={32} fw={700}>
            Contributions
          </Title>
          <Title order={2} size={32} c="gray.6">
            {totalContributions.toLocaleString()} Efforts to Grow the Pie
          </Title>
        </Group>
      </Group>

      {/* Filters */}
      <Group justify="space-between" align="center">
        <Tabs
          value={activeTab}
          onChange={(value) => setActiveTab(value || 'all')}
          variant="pills"
        >
          <Tabs.List>
            <Tabs.Tab
              value="all"
              style={{
                backgroundColor:
                  activeTab === 'all' ? '#FFDD44' : 'transparent',
                color: '#000000',
              }}
            >
              All
            </Tabs.Tab>
            <Tabs.Tab
              value="validating"
              style={{
                backgroundColor:
                  activeTab === 'validating' ? '#FFDD44' : 'transparent',
                color: '#000000',
              }}
            >
              Validating
            </Tabs.Tab>
            <Tabs.Tab
              value="on-chain"
              style={{
                backgroundColor:
                  activeTab === 'on-chain' ? '#FFDD44' : 'transparent',
                color: '#000000',
              }}
            >
              On-Chain
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>

        <Select
          variant="filled"
          placeholder="Contributor"
          data={contributors}
          value={selectedContributor}
          onChange={setSelectedContributor}
          clearable
          rightSection={<IconChevronDown size={16} />}
          w={200}
          radius="md"
        />
      </Group>

      {/* Contribution Cards */}
      {filteredContributions.length === 0 ? (
        <Box 
          style={{ 
            backgroundColor: '#F9F9F9', 
            borderRadius: 24, 
            padding: 40,
            textAlign: 'center'
          }}
        >
          <Text size="lg" c="gray.6">
            No contributions found
          </Text>
          <Text size="sm" c="gray.5" mt={8}>
            {activeTab === 'all' 
              ? 'Be the first to contribute to this project!' 
              : `No contributions with ${activeTab} status found.`}
          </Text>
        </Box>
      ) : (
        <Box style={{ backgroundColor: '#F9F9F9', borderRadius: 24, padding: 8 }}>
          <SimpleGrid cols={2} spacing={8}>
            {filteredContributions.map((contribution) => (
              <ContributionCard
                key={contribution.id}
                contribution={{
                  ...contribution,
                  createdAt: new Date(contribution.createdAt),
                  updatedAt: new Date(contribution.updatedAt),
                  startAt: contribution.startAt ? new Date(contribution.startAt) : null,
                  endAt: contribution.endAt ? new Date(contribution.endAt) : null,
                }}
                projectId={projectId}
              />
            ))}
          </SimpleGrid>

          {pagination && pagination.totalPages > 1 && (
            <Group justify="center" mt={16}>
              <Pagination
                value={currentPage}
                onChange={setCurrentPage}
                total={pagination.totalPages}
                size="sm"
              />
            </Group>
          )}
        </Box>
      )}
    </Stack>
  );
}
