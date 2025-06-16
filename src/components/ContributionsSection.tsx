import {
  Stack,
  Title,
  Text,
  Tabs,
  Select,
  Group,
  Pagination,
  Box,
  SimpleGrid,
} from '@mantine/core';
import { IconChevronDown } from '@tabler/icons-react';
import { useState } from 'react';
import { ContributionCard } from './ContributionCard';

// Mock data for contributions
const mockContributions = [
  {
    id: 1,
    contributor: {
      name: 'Char',
      avatar: '/homepage/step2-icon.png',
    },
    status: 'voting' as const,
    content:
      'I reviewed the Fairsharing wireframe and made changes to the design.',
    hours: 2,
    date: '2025.03.29',
    hashtag: 'DevWG',
    lxp: 20,
    votes: { support: 10, oppose: 10, abstain: 10 },
    isOwn: true,
  },
  {
    id: 2,
    contributor: {
      name: 'Markus',
      avatar: '/homepage/step2-icon.png',
    },
    status: 'pass' as const,
    content:
      'I reviewed the Fairsharing wireframe and made changes to the design.',
    hours: 2,
    date: '2025.03.29',
    hashtag: 'DevWG',
    lxp: 20,
    votes: { support: 10, oppose: 10, abstain: 10 },
    isOwn: false,
  },
  {
    id: 3,
    contributor: {
      name: 'Char',
      avatar: '/homepage/step2-icon.png',
    },
    status: 'voting' as const,
    content:
      '1. AI Hackathon 2.0: Idea day talk, Organisation Jury, tally form creation；Space talk ~ 5.5h 1. AI Hackathon 2.0: Idea day talk, Organisation Jury, tally form creation；Space talk ~ 5.5h 1. AI Hackathon 2.0: Idea day talk, Organisation Jury, tally form creation；Space talk ~ 5.5h 1. AI Hackathon 2.0: Idea day talk, Organisation Jury, tally form creation；Space talk ~ 5.5h ',
    hours: 2,
    date: '2025.03.29',
    hashtag: 'DevWG',
    lxp: 20,
    votes: { support: 10, oppose: 10, abstain: 10 },
    isOwn: true,
  },
  {
    id: 4,
    contributor: {
      name: 'Markus',
      avatar: '/homepage/step2-icon.png',
    },
    status: 'pass' as const,
    content:
      '1. I reviewed the Fairsharing wireframe and made changes to the design. ...',
    hours: 2,
    date: '2025.03.29',
    hashtag: 'DevWG',
    lxp: 20,
    votes: { support: 10, oppose: 10, abstain: 10 },
    isOwn: false,
  },
  {
    id: 5,
    contributor: {
      name: 'Keylen',
      avatar: '/homepage/step2-icon.png',
    },
    status: 'fail' as const,
    content:
      'I reviewed the Fairsharing wireframe and made changes to the design.',
    hours: 2,
    date: '2025.03.29',
    hashtag: 'DevWG',
    lxp: 20,
    votes: { support: 10, oppose: 10, abstain: 10 },
    isOwn: false,
  },
  {
    id: 6,
    contributor: {
      name: 'Keylen',
      avatar: '/homepage/step2-icon.png',
    },
    status: 'fail' as const,
    content:
      'I reviewed the Fairsharing wireframe and made changes to the design.',
    hours: 2,
    date: '2025.03.29',
    hashtag: 'DevWG',
    lxp: 20,
    votes: { support: 10, oppose: 10, abstain: 10 },
    isOwn: false,
  },
  {
    id: 7,
    contributor: {
      name: 'Char',
      avatar: '/homepage/step2-icon.png',
    },
    status: 'voting' as const,
    content:
      'I reviewed the Fairsharing wireframe and made changes to the design for two rounds.',
    hours: 2,
    date: '2025.03.29',
    hashtag: 'DevWG',
    lxp: 20,
    votes: { support: 10, oppose: 10, abstain: 10 },
    isOwn: true,
  },
];

export function ContributionsSection() {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedContributor, setSelectedContributor] = useState<string | null>(
    null,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Filter contributions based on active tab and selected contributor
  const filteredContributions = mockContributions.filter((contribution) => {
    const statusFilter =
      activeTab === 'all' ||
      (activeTab === 'validating' && contribution.status === 'voting') ||
      (activeTab === 'on-chain' &&
        (contribution.status === 'pass' || contribution.status === 'fail'));

    const contributorFilter =
      !selectedContributor ||
      contribution.contributor.name === selectedContributor;

    return statusFilter && contributorFilter;
  });

  const totalContributions = 1000;
  const totalPages = Math.ceil(filteredContributions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedContributions = filteredContributions.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  // Get unique contributors for the select dropdown
  const contributors = Array.from(
    new Set(mockContributions.map((c) => c.contributor.name)),
  );

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
      <Box style={{ backgroundColor: '#F9F9F9', borderRadius: 24, padding: 8 }}>
        <SimpleGrid cols={2} spacing={8}>
          {paginatedContributions.map((contribution) => (
            <ContributionCard
              key={contribution.id}
              contribution={contribution}
            />
          ))}
        </SimpleGrid>
      </Box>

      {/* Pagination */}
      {totalPages > 1 && (
        <Group justify="space-between" align="center" mt={32}>
          <Group gap={16} align="center">
            <Text size="sm" c="gray.6">
              Rows per page:
            </Text>
            <Select
              data={['20', '50', '100']}
              value={itemsPerPage.toString()}
              onChange={(value) => {
                setItemsPerPage(Number(value) || 20);
                setCurrentPage(1);
              }}
              w={80}
              size="sm"
            />
          </Group>

          <Group gap={16} align="center">
            <Text size="sm" c="gray.6">
              {startIndex + 1}-
              {Math.min(
                startIndex + itemsPerPage,
                filteredContributions.length,
              )}{' '}
              of {filteredContributions.length}
            </Text>
            <Pagination
              value={currentPage}
              onChange={setCurrentPage}
              total={totalPages}
              size="sm"
            />
          </Group>
        </Group>
      )}
    </Stack>
  );
}
