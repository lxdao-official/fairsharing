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
} from '@mantine/core';
import {
  IconLink,
  IconBrandTwitter,
  IconBrandGithub,
  IconBrandLinkedin,
  IconCopy,
  IconExternalLink,
} from '@tabler/icons-react';
import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { ProjectCard } from '../../../components/ProjectCard';
import { ContributionCard } from '../../../components/ContributionCard';

// Mock projects data for ProjectCard
const mockActiveProjects = [
  {
    id: 'lxdao-wg',
    title: 'LXDAO Working Group',
    description: 'The working group of LXDAO.',
    contributions: '1.2k',
    pieBakers: '100',
    logo: '/homepage/step2-icon.png',
  },
  {
    id: 'ethpanda',
    title: 'ETH Panda',
    description: 'Educational platform for Ethereum developers.',
    contributions: '850',
    pieBakers: '75',
    logo: '/homepage/step2-icon.png',
  },
  {
    id: 'fairsharing',
    title: 'FairSharing',
    description: 'Grow the Pie Together Share the Reward Fairly',
    contributions: '420',
    pieBakers: '28',
    logo: '/homepage/step2-icon.png',
  },
  {
    id: 'web3-education',
    title: 'Web3 Education Hub',
    description: 'Comprehensive Web3 learning resources and tutorials.',
    contributions: '320',
    pieBakers: '45',
    logo: '/homepage/step2-icon.png',
  },
  {
    id: 'defi-protocol',
    title: 'DeFi Protocol',
    description: 'Decentralized finance protocol for yield farming.',
    contributions: '280',
    pieBakers: '35',
    logo: '/homepage/step2-icon.png',
  },
];

// Mock contributions data for My Contributions section
const mockUserContributions = [
  {
    id: 1,
    contributor: {
      name: 'Bruce Xu',
      avatar: '/homepage/step2-icon.png',
    },
    status: 'voting' as const,
    content:
      'I reviewed the Fairsharing wireframe and made changes to the design.',
    hours: 2,
    date: '2025.03.29',
    hashtag: 'DevWG',
    lxp: 20,
    votes: {
      support: 8,
      oppose: 2,
      abstain: 1,
    },
    isOwn: true,
  },
  {
    id: 2,
    contributor: {
      name: 'Bruce Xu',
      avatar: '/homepage/step2-icon.png',
    },
    status: 'pass' as const,
    content:
      'AI Hackathon 2.0: Idea day talk, Organisation Jury, tally form creation. Space talk and mentoring session.',
    hours: 5.5,
    date: '2025.03.28',
    hashtag: 'AIHack',
    lxp: 55,
    votes: {
      support: 15,
      oppose: 3,
      abstain: 2,
    },
    isOwn: true,
  },
  {
    id: 3,
    contributor: {
      name: 'Bruce Xu',
      avatar: '/homepage/step2-icon.png',
    },
    status: 'pass' as const,
    content:
      'Developed the user profile page and implemented tooltip functionality for project visualization.',
    hours: 8,
    date: '2025.03.27',
    hashtag: 'DevWG',
    lxp: 80,
    votes: {
      support: 12,
      oppose: 1,
      abstain: 0,
    },
    isOwn: true,
  },
  {
    id: 4,
    contributor: {
      name: 'Bruce Xu',
      avatar: '/homepage/step2-icon.png',
    },
    status: 'fail' as const,
    content:
      'Created comprehensive tutorial content for smart contract development.',
    hours: 6,
    date: '2025.03.26',
    hashtag: 'Education',
    lxp: 60,
    votes: {
      support: 4,
      oppose: 8,
      abstain: 3,
    },
    isOwn: true,
  },
  {
    id: 5,
    contributor: {
      name: 'Bruce Xu',
      avatar: '/homepage/step2-icon.png',
    },
    status: 'voting' as const,
    content:
      'Code review and security audit for the new yield farming feature.',
    hours: 4,
    date: '2025.03.25',
    hashtag: 'Security',
    lxp: 40,
    votes: {
      support: 6,
      oppose: 2,
      abstain: 1,
    },
    isOwn: true,
  },
];

// Mock user data
const mockUser = {
  address: '0x1234567890123456789012345678901234567890',
  name: 'Bruce Xu',
  avatar: '/homepage/step2-icon.png',
  bio: 'Web3 x AI | Ethernaut | Cypherpunk-aligned | INTJ | Co-initiator @LXDAO_Official @ethpanda_org | 面向趋势及未来 | The Only TG: @brucexu_eth',
  socialLinks: [
    {
      type: 'twitter',
      icon: IconBrandTwitter,
      url: 'https://twitter.com/brucexu_eth',
      label: '@brucexu_eth',
    },
    {
      type: 'github',
      icon: IconBrandGithub,
      url: 'https://github.com/brucexu-eth',
      label: '@brucexu_eth',
    },
    {
      type: 'linkedin',
      icon: IconBrandLinkedin,
      url: 'https://linkedin.com/in/bruce-xu',
      label: 'Bruce Xu',
    },
  ],
  customLinks: [
    {
      title: 'Personal Website',
      url: 'https://brucexu.eth',
      icon: IconLink,
    },
    {
      title: 'Blog',
      url: 'https://blog.brucexu.eth',
      icon: IconExternalLink,
    },
  ],
  stats: {
    totalContributions: 600,
    totalProjects: 15,
    totalEarned: 1250,
    validationScore: 98,
  },
  walletInfo: {
    address: '0x1234...7890',
    ensName: 'brucexu.eth',
    balance: '12.5 ETH',
    tokens: ['USDC', 'DAI', 'WETH'],
  },
};

export default function UserPage() {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // My Contributions state
  const [activeContributionTab, setActiveContributionTab] = useState('all');
  const [currentContributionPage, setCurrentContributionPage] = useState(1);
  const [itemsPerPage] = useState(6);

  // Filter contributions based on active tab
  const filteredContributions = mockUserContributions.filter((contribution) => {
    if (activeContributionTab === 'all') return true;
    if (activeContributionTab === 'validating')
      return contribution.status === 'voting';
    if (activeContributionTab === 'on-chain')
      return contribution.status === 'pass' || contribution.status === 'fail';
    if (activeContributionTab === 'failed')
      return contribution.status === 'fail';
    return true;
  });

  const totalContributions = 560;
  const totalPages = Math.ceil(filteredContributions.length / itemsPerPage);
  const startIndex = (currentContributionPage - 1) * itemsPerPage;
  const paginatedContributions = filteredContributions.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  return (
    <Layout>
      <Container size="xl" py={40}>
        <Group gap={80} align="flex-start" style={{ width: '100%' }}>
          {/* Left Column */}
          <Box style={{ width: 240, flexShrink: 0 }}>
            <Stack gap={32}>
              <Avatar
                src={mockUser.avatar}
                size={200}
                radius="50%"
                style={{
                  border: '2px solid #f0f0f0',
                  display: 'block',
                  margin: '0 auto',
                }}
              />
              <Box>
                <Text size="sm" c="dark.7" style={{ lineHeight: 1.6 }}>
                  {mockUser.bio}
                </Text>
              </Box>

              {/* Social Links */}
              <Stack gap={8}>
                {mockUser.socialLinks.map((link, index) => (
                  <Group key={index} gap={8} align="center">
                    <link.icon size={16} color="#666" />
                    <Anchor
                      href={link.url}
                      target="_blank"
                      size="sm"
                      c="dark.6"
                      td="none"
                    >
                      {link.label}
                    </Anchor>
                  </Group>
                ))}
              </Stack>

              {/* All Pies */}
              <Stack
                gap={16}
                style={{ borderTop: '1px solid #DEE2E6' }}
                pt={24}
              >
                <Title order={3} size={18} fw={600}>
                  All Pies
                </Title>
                <Box>
                  <SimpleGrid cols={4} spacing={12}>
                    {Array.from({ length: 12 }, (_, index) => (
                      <Tooltip
                        key={index}
                        label={`Project ${index + 1}`}
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
                            src="/homepage/step2-icon.png"
                            size={48}
                            radius="md"
                          />
                        </Box>
                      </Tooltip>
                    ))}
                  </SimpleGrid>
                </Box>
              </Stack>
            </Stack>
          </Box>

          {/* Right Column */}
          <Box style={{ flex: 1 }}>
            <Stack gap={32}>
              <Box mt={24}>
                <Stack gap={24} align="left">
                  <Stack gap={8}>
                    <Title order={1} size={28} fw={700}>
                      {mockUser.name}
                    </Title>
                    <Group gap={8}>
                      <Text size="sm" c="gray.6" ff="monospace">
                        0x123456
                      </Text>
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        size="xs"
                        onClick={() => copyToClipboard(mockUser.address)}
                      >
                        <IconCopy size={12} />
                      </ActionIcon>
                    </Group>
                  </Stack>

                  {/* Stats Row */}
                  <Group gap={48} justify="left">
                    <Stack gap={4}>
                      <Text size="md" c="gray.6" fw={700}>
                        Contributions
                      </Text>
                      <Text size="md" fw={700} c="dark">
                        600
                      </Text>
                    </Stack>
                    <Stack gap={4}>
                      <Text size="md" c="gray.6" fw={700}>
                        Pies in Making
                      </Text>
                      <Text size="md" fw={700} c="dark">
                        10
                      </Text>
                    </Stack>
                    <Stack gap={4}>
                      <Text size="md" c="gray.6" fw={700}>
                        Validation
                      </Text>
                      <Text size="md" fw={700} c="dark">
                        10
                      </Text>
                    </Stack>
                  </Group>
                </Stack>
              </Box>
              {/* Active Projects Header */}
              <Box mt={24}>
                <Title order={2} size={28} fw={600}>
                  Active in Making 5 Pies in the Last Year
                </Title>
              </Box>

              {/* Active Projects Grid */}
              <SimpleGrid cols={3} spacing={24}>
                {mockActiveProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    id={project.id}
                    title={project.title}
                    description={project.description}
                    contributions={project.contributions}
                    pieBakers={project.pieBakers}
                    logo={project.logo}
                  />
                ))}
              </SimpleGrid>

              {/* My Contributions Section */}
              <Stack gap={24} mt={32}>
                <Group justify="space-between" align="baseline">
                  <Group gap={16} align="baseline">
                    <Title order={2} size={28} fw={700}>
                      {totalContributions} Contributions in the Last Year
                    </Title>
                  </Group>
                </Group>

                {/* Tabs */}
                <Tabs
                  value={activeContributionTab}
                  onChange={(value) => setActiveContributionTab(value || 'all')}
                  variant="pills"
                >
                  <Tabs.List>
                    <Tabs.Tab
                      value="all"
                      style={{
                        backgroundColor:
                          activeContributionTab === 'all'
                            ? '#FFDD44'
                            : 'transparent',
                        color: '#000000',
                        borderRadius: '24px',
                        padding: '8px 24px',
                      }}
                    >
                      All
                    </Tabs.Tab>
                    <Tabs.Tab
                      value="validating"
                      style={{
                        backgroundColor:
                          activeContributionTab === 'validating'
                            ? '#FFDD44'
                            : 'transparent',
                        color: '#000000',
                        borderRadius: '24px',
                        padding: '8px 24px',
                      }}
                    >
                      Validating
                    </Tabs.Tab>
                    <Tabs.Tab
                      value="on-chain"
                      style={{
                        backgroundColor:
                          activeContributionTab === 'on-chain'
                            ? '#FFDD44'
                            : 'transparent',
                        color: '#000000',
                        borderRadius: '24px',
                        padding: '8px 24px',
                      }}
                    >
                      On-Chain
                    </Tabs.Tab>
                    <Tabs.Tab
                      value="failed"
                      style={{
                        backgroundColor:
                          activeContributionTab === 'failed'
                            ? '#FFDD44'
                            : 'transparent',
                        color: '#000000',
                        borderRadius: '24px',
                        padding: '8px 24px',
                      }}
                    >
                      Failed
                    </Tabs.Tab>
                  </Tabs.List>
                </Tabs>

                {/* Contribution Cards */}
                <Box
                  style={{
                    backgroundColor: '#F9F9F9',
                    borderRadius: 24,
                    padding: 8,
                  }}
                >
                  <SimpleGrid cols={2} spacing={8}>
                    {paginatedContributions.map((contribution) => (
                      <ContributionCard
                        key={contribution.id}
                        contribution={contribution}
                      />
                    ))}
                  </SimpleGrid>

                  {totalPages > 1 && (
                    <Group justify="center" mt={16}>
                      <Pagination
                        value={currentContributionPage}
                        onChange={setCurrentContributionPage}
                        total={totalPages}
                        size="sm"
                      />
                    </Group>
                  )}
                </Box>
              </Stack>
            </Stack>
          </Box>
        </Group>
      </Container>
    </Layout>
  );
}
