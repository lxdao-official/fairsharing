'use client';

import {
  Stack,
  Title,
  Text,
  Group,
  TextInput,
  Select,
  Table,
  Avatar,
  Pagination,
  Box,
  ActionIcon,
  Alert,
} from '@mantine/core';
import {
  IconSearch,
  IconChevronDown,
  IconTable,
  IconChartPie,
  IconCopy,
  IconInfoCircle,
} from '@tabler/icons-react';
import { useState, useMemo } from 'react';
import { PieChart } from '@mantine/charts';
import { trpc } from '@/utils/trpc';
import { LoadingSpinner } from './LoadingSpinner';

type ViewMode = 'table' | 'chart';
type SortBy = 'contributions' | 'percentage' | 'recent' | 'name';

interface ContributorsSectionProps {
  projectId: string;
}

export function ContributorsSection({ projectId }: ContributorsSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('contributions');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch contributors data
  const { data: contributorsData, isLoading, error } = trpc.contributor.list.useQuery({
    projectId,
    limit: 100, // Get all contributors
    sortBy,
  });

  // Filter contributors based on search query
  const filteredContributors = useMemo(() => {
    if (!contributorsData?.contributors) return [];
    
    return contributorsData.contributors.filter((contributor) => {
      const name = contributor.user.name || contributor.user.ensName || contributor.user.walletAddress;
      const role = Array.isArray(contributor.role) ? contributor.role.join(' ') : contributor.role;
      
      return (
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        role.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [contributorsData?.contributors, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredContributors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedContributors = filteredContributors.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  // Prepare pie chart data
  const pieChartData = useMemo(() => {
    return filteredContributors.map((contributor, index) => ({
      name: contributor.user.name || 
             contributor.user.ensName || 
             `${contributor.user.walletAddress.slice(0, 6)}...${contributor.user.walletAddress.slice(-4)}`,
      value: contributor.percentage,
      color: `hsl(${45 + index * 72}, 70%, ${60 - index * 8}%)`,
    }));
  }, [filteredContributors]);

  // Helper function to format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Helper function to get role display
  const getRoleDisplay = (roles: string[]) => {
    if (Array.isArray(roles)) {
      return roles.join(', ');
    }
    return roles || 'CONTRIBUTOR';
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading contributors..." />;
  }

  if (error) {
    return (
      <Alert color="red" icon={<IconInfoCircle size={16} />}>
        Failed to load contributors: {error.message}
      </Alert>
    );
  }
  const totalContributors = contributorsData?.totalContributors ?? 0;
  const hasContributors = filteredContributors.length > 0;

  return (
    <Stack gap={32}>
      {/* Header */}
      <Group justify="space-between" align="baseline">
        <Group gap={16} align="baseline">
          <Title order={2} size={32} fw={700}>
            Contributors
          </Title>
          <Text size="lg" c="gray.6">
            Meet the {totalContributors} Pie Bakers
          </Text>
        </Group>
      </Group>

      {/* Controls */}
      <Group justify="space-between" align="center">
        <Group gap={16}>
          <TextInput
            placeholder="find a pie"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftSection={<IconSearch size={16} />}
            style={{
              backgroundColor: '#FEF3C7',
              borderRadius: '24px',
            }}
            styles={{
              input: {
                backgroundColor: '#FEF3C7',
                border: 'none',
                borderRadius: '24px',
                paddingLeft: '40px',
              },
            }}
            w={200}
          />
        </Group>

        <Group gap={16}>
          <Group gap={8} align="center">
            <Text size="sm" c="gray.6">
              Sort By
            </Text>
            <Select
              variant="filled"
              data={[
                { value: 'contributions', label: 'Contributions' },
                { value: 'percentage', label: 'Percentage' },
                { value: 'recent', label: 'Recently Active' },
                { value: 'name', label: 'Name' },
              ]}
              value={sortBy}
              onChange={(value) => setSortBy(value as SortBy)}
              rightSection={<IconChevronDown size={16} />}
              w={150}
            />
          </Group>

          <Group gap={8}>
            <ActionIcon
              variant={viewMode === 'table' ? 'filled' : 'subtle'}
              color={viewMode === 'table' ? 'yellow' : 'gray'}
              onClick={() => setViewMode('table')}
              size="sm"
            >
              <IconTable size={16} />
            </ActionIcon>
            <ActionIcon
              variant={viewMode === 'chart' ? 'filled' : 'subtle'}
              color={viewMode === 'chart' ? 'yellow' : 'gray'}
              onClick={() => setViewMode('chart')}
              size="sm"
            >
              <IconChartPie size={16} />
            </ActionIcon>
          </Group>
        </Group>
      </Group>

      {/* Content */}
      {hasContributors ? (
        viewMode === 'table' ? (
          <Stack gap={16}>
            {/* Table */}
            <Box
              style={{
                backgroundColor: 'white',
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              <Table>
                <Table.Thead>
                  <Table.Tr style={{ backgroundColor: '#F8F9FA' }}>
                    <Table.Th>Name</Table.Th>
                    <Table.Th>ETH wallet</Table.Th>
                    <Table.Th>Role</Table.Th>
                    <Table.Th>
                      <Group gap={4} align="center">
                        <Text>Percentage</Text>
                        <IconChevronDown size={12} />
                      </Group>
                    </Table.Th>
                    <Table.Th>Pie slice earned</Table.Th>
                    <Table.Th>
                      <Group gap={4} align="center">
                        <Text>Recently active</Text>
                        <IconChevronDown size={12} />
                      </Group>
                    </Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paginatedContributors.map((contributor) => (
                    <Table.Tr key={contributor.user.id}>
                      <Table.Td>
                        <Group gap={12} align="center">
                          <Avatar
                            src={contributor.user.avatar || '/homepage/step2-icon.png'}
                            size={32}
                            radius="50%"
                          />
                          <Text fw={500}>
                            {contributor.user.name || 
                             contributor.user.ensName || 
                             `${contributor.user.walletAddress.slice(0, 6)}...${contributor.user.walletAddress.slice(-4)}`}
                          </Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={8} align="center">
                          <Text size="sm" c="gray.6">
                            {`${contributor.user.walletAddress.slice(0, 6)}...${contributor.user.walletAddress.slice(-4)}`}
                          </Text>
                          <ActionIcon
                            variant="subtle"
                            color="gray"
                            size="xs"
                            onClick={() => copyToClipboard(contributor.user.walletAddress)}
                          >
                            <IconCopy size={12} />
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{getRoleDisplay(contributor.role)}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text fw={500}>{contributor.percentage.toFixed(2)}%</Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={8} align="center">
                          <Text>🥧</Text>
                          <Text fw={500}>{contributor.totalPoints}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="gray.6">
                          {formatDate(contributor.recentActivity)}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Box>

            {/* Pagination */}

            <Group justify="space-between" align="center">
              <Group gap={16} align="center">
                <Text size="sm" c="gray.6">
                  Rows per page:
                </Text>
                <Select
                  data={['10', '20', '50']}
                  value={itemsPerPage.toString()}
                  onChange={(value) => {
                    setItemsPerPage(Number(value) || 10);
                    setCurrentPage(1);
                  }}
                  w={80}
                  size="sm"
                />
              </Group>

              <Group gap={16} align="center">
                <Text size="sm" c="gray.6">
                  {startIndex + 1}-
                  {Math.min(startIndex + itemsPerPage, filteredContributors.length)}{' '}
                  of {filteredContributors.length}
                </Text>
                <Pagination
                  value={currentPage}
                  onChange={setCurrentPage}
                  total={totalPages}
                  size="sm"
                />
              </Group>
            </Group>
          </Stack>
        ) : (
          /* Pie Chart View */
          <Stack gap={32} align="center">
            <Box
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                minHeight: 500,
              }}
            >
              <PieChart
                data={pieChartData}
                size={400}
                withLabelsLine
                labelsPosition="outside"
                labelsType="percent"
                withTooltip
                tooltipDataSource="segment"
                strokeWidth={1}
                mx="auto"
              />
            </Box>

            {/* Contributors Legend */}
            <Group gap={24} justify="center" wrap="wrap">
              {filteredContributors.map((contributor, index) => (
                <Group key={contributor.user.id} gap={8} align="center">
                  <Box
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: `hsl(${45 + index * 72}, 70%, ${
                        60 - index * 8
                      }%)`,
                    }}
                  />
                  <Avatar 
                    src={contributor.user.avatar || '/homepage/step2-icon.png'} 
                    size={24} 
                    radius="50%" 
                  />
                  <Text size="sm" fw={500}>
                    {contributor.user.name || 
                     contributor.user.ensName || 
                     `${contributor.user.walletAddress.slice(0, 6)}...${contributor.user.walletAddress.slice(-4)}`} {contributor.percentage.toFixed(1)}%
                  </Text>
                </Group>
              ))}
            </Group>
          </Stack>
        )
      ) : (
        <Box
          style={{
            backgroundColor: '#F9F9F9',
            borderRadius: 24,
            padding: 40,
            textAlign: 'center',
          }}
        >
          <Text size="lg" c="gray.6">
            No contributors found
          </Text>
          <Text size="sm" c="gray.5" mt={8}>
            Contributors will appear here once they start making contributions.
          </Text>
        </Box>
      )}
    </Stack>
  );
}
