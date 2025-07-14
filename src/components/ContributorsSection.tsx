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
} from '@mantine/core';
import {
  IconSearch,
  IconChevronDown,
  IconTable,
  IconChartPie,
  IconCopy,
} from '@tabler/icons-react';
import { useState } from 'react';
import { PieChart } from '@mantine/charts';

// Mock data for contributors
const mockContributors = [
  {
    id: 1,
    name: 'Bruce Xu',
    avatar: '/homepage/step2-icon.png',
    ethWallet: '0xse8...Ca79',
    role: 'Project Manager',
    percentage: 35.86,
    pieSliceEarned: 240,
    recentlyActive: 'Jul 6, 2023',
  },
  {
    id: 2,
    name: 'Alice Chen',
    avatar: '/homepage/step2-icon.png',
    ethWallet: '0xab3...De45',
    role: 'Product Manager',
    percentage: 25.45,
    pieSliceEarned: 170,
    recentlyActive: 'Jul 5, 2023',
  },
  {
    id: 3,
    name: 'Charlie Wang',
    avatar: '/homepage/step2-icon.png',
    ethWallet: '0xcd6...Fg78',
    role: 'FE',
    percentage: 18.73,
    pieSliceEarned: 125,
    recentlyActive: 'Jul 4, 2023',
  },
  {
    id: 4,
    name: 'Diana Liu',
    avatar: '/homepage/step2-icon.png',
    ethWallet: '0xef9...Hi01',
    role: 'BE',
    percentage: 12.56,
    pieSliceEarned: 84,
    recentlyActive: 'Jul 3, 2023',
  },
  {
    id: 5,
    name: 'Eva Zhang',
    avatar: '/homepage/step2-icon.png',
    ethWallet: '0xgh2...Jk23',
    role: 'Designer',
    percentage: 7.4,
    pieSliceEarned: 49,
    recentlyActive: 'Jul 2, 2023',
  },
];

type ViewMode = 'table' | 'chart';
type SortBy = 'contributions' | 'percentage' | 'recent' | 'name';

export function ContributorsSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('contributions');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filter and sort contributors
  const filteredContributors = mockContributors.filter(
    (contributor) =>
      contributor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contributor.role.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const sortedContributors = [...filteredContributors].sort((a, b) => {
    switch (sortBy) {
      case 'contributions':
        return b.pieSliceEarned - a.pieSliceEarned;
      case 'percentage':
        return b.percentage - a.percentage;
      case 'recent':
        return (
          new Date(b.recentlyActive).getTime() -
          new Date(a.recentlyActive).getTime()
        );
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  const totalPages = Math.ceil(sortedContributors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedContributors = sortedContributors.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  // Prepare pie chart data
  const pieChartData = sortedContributors.map((contributor, index) => ({
    name: contributor.name,
    value: contributor.percentage,
    color: `hsl(${45 + index * 72}, 70%, ${60 - index * 8}%)`,
  }));

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Stack gap={32}>
      {/* Header */}
      <Group justify="space-between" align="baseline">
        <Group gap={16} align="baseline">
          <Title order={2} size={32} fw={700}>
            Contributors
          </Title>
          <Text size="lg" c="gray.6">
            Meet the {mockContributors.length} Pie Bakers
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
      {viewMode === 'table' ? (
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
                  <Table.Tr key={contributor.id}>
                    <Table.Td>
                      <Group gap={12} align="center">
                        <Avatar
                          src={contributor.avatar}
                          size={32}
                          radius="50%"
                        />
                        <Text fw={500}>{contributor.name}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={8} align="center">
                        <Text size="sm" c="gray.6">
                          {contributor.ethWallet}
                        </Text>
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          size="xs"
                          onClick={() => copyToClipboard(contributor.ethWallet)}
                        >
                          <IconCopy size={12} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{contributor.role}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text fw={500}>{contributor.percentage}%</Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={8} align="center">
                        <Text>🥧</Text>
                        <Text fw={500}>{contributor.pieSliceEarned}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="gray.6">
                        {contributor.recentlyActive}
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
                {Math.min(startIndex + itemsPerPage, sortedContributors.length)}{' '}
                of {sortedContributors.length}
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
            {sortedContributors.map((contributor, index) => (
              <Group key={contributor.id} gap={8} align="center">
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
                <Avatar src={contributor.avatar} size={24} radius="50%" />
                <Text size="sm" fw={500}>
                  {contributor.name} {contributor.percentage}%
                </Text>
              </Group>
            ))}
          </Group>
        </Stack>
      )}
    </Stack>
  );
}
