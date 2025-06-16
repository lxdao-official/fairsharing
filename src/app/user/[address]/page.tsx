'use client';

import {
  Container,
  Grid,
  Stack,
  Title,
  Text,
  Avatar,
  Group,
  Button,
  Card,
  Box,
  Badge,
  ActionIcon,
  Anchor,
  Divider,
  SimpleGrid,
  Tooltip,
} from '@mantine/core';
import {
  IconLink,
  IconBrandTwitter,
  IconBrandGithub,
  IconBrandLinkedin,
  IconCopy,
  IconExternalLink,
} from '@tabler/icons-react';
import { Layout } from '@/components/Layout';
import { ProjectCard } from '../../../components/ProjectCard';

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

interface UserPageProps {
  params: {
    address: string;
  };
}

export default function UserPage({ params }: UserPageProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

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
            </Stack>
          </Box>
        </Group>
      </Container>
    </Layout>
  );
}
