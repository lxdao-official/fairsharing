import {
  Box,
  Stack,
  Group,
  Avatar,
  Text,
  Badge,
  Button,
  ActionIcon,
} from '@mantine/core';
import {
  IconEdit,
  IconClock,
  IconCalendar,
  IconHash,
  IconCheck,
  IconX,
  IconMinus,
} from '@tabler/icons-react';
import { useState } from 'react';

interface Contribution {
  id: number;
  contributor: {
    name: string;
    avatar: string;
  };
  status: 'voting' | 'pass' | 'fail';
  content: string;
  hours: number;
  date: string;
  hashtag: string;
  lxp: number;
  votes: {
    support: number;
    oppose: number;
    abstain: number;
  };
  isOwn: boolean;
}

interface ContributionCardProps {
  contribution: Contribution;
}

export function ContributionCard({ contribution }: ContributionCardProps) {
  // Simulate user vote based on contribution status for demo
  const initialVote =
    contribution.status === 'pass'
      ? 'support'
      : contribution.status === 'fail'
      ? 'oppose'
      : null;

  const [userVote, setUserVote] = useState<
    'support' | 'oppose' | 'abstain' | null
  >(initialVote);
  const [isContentHovered, setIsContentHovered] = useState(false);

  const getStatusBadge = (status: Contribution['status']) => {
    switch (status) {
      case 'voting':
        return (
          <Badge
            size="sm"
            style={{
              backgroundColor: '#FEF3C7',
              color: '#92400E',
              border: 'none',
            }}
          >
            Voting
          </Badge>
        );
      case 'pass':
        return (
          <Badge
            size="sm"
            style={{
              backgroundColor: '#D1FAE5',
              color: '#065F46',
              border: 'none',
            }}
          >
            Pass
          </Badge>
        );
      case 'fail':
        return (
          <Badge
            size="sm"
            style={{
              backgroundColor: '#FEE2E2',
              color: '#991B1B',
              border: 'none',
            }}
          >
            Fail
          </Badge>
        );
    }
  };

  const getVoteItemStyle = (
    voteType: 'support' | 'oppose' | 'abstain',
    isActive: boolean,
  ) => {
    const baseStyle = {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 8px',
      borderRadius: '16px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    };

    // For pass/fail status, show selected state but disabled
    const isDisabled =
      contribution.status === 'pass' || contribution.status === 'fail';

    if (isDisabled && !isActive) {
      return {
        ...baseStyle,
        backgroundColor: 'transparent',
        color: '#9CA3AF',
        cursor: 'not-allowed',
      };
    }

    switch (voteType) {
      case 'support':
        return {
          ...baseStyle,
          backgroundColor: isActive ? '#10B981' : 'transparent',
          color: isActive ? 'white' : '#10B981',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
        };
      case 'oppose':
        return {
          ...baseStyle,
          backgroundColor: isActive ? '#EF4444' : 'transparent',
          color: isActive ? 'white' : '#EF4444',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
        };
      case 'abstain':
        return {
          ...baseStyle,
          backgroundColor: isActive ? '#6B7280' : 'transparent',
          color: isActive ? 'white' : '#6B7280',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
        };
    }
  };

  const handleVote = (voteType: 'support' | 'oppose' | 'abstain') => {
    const isDisabled =
      contribution.status === 'pass' || contribution.status === 'fail';
    if (isDisabled) return;
    setUserVote(userVote === voteType ? null : voteType);
  };

  return (
    <Box
      style={{
        borderRadius: 24,
        padding: 16,
        backgroundColor: 'white',
        maxWidth: 588,
      }}
    >
      <Group align="flex-start" display="flex" style={{ flexWrap: 'nowrap' }}>
        <Avatar src={contribution.contributor.avatar} size={40} radius="50%" />
        <Stack gap={8}>
          <Group justify="space-between">
            <Text fw={600} size="md">
              {contribution.contributor.name}
            </Text>
            <Group align="center">
              {getStatusBadge(contribution.status)}
              {contribution.isOwn && (
                <ActionIcon variant="subtle" color="gray" size="sm">
                  <IconEdit size={16} />
                </ActionIcon>
              )}
            </Group>
          </Group>
          <Box>
            <Text
              size="md"
              style={{
                cursor:
                  contribution.content.length > 100 ? 'pointer' : 'default',
                lineHeight: 1.5,
                transition: 'all 0.2s ease',
              }}
              lineClamp={
                isContentHovered || contribution.content.length <= 100
                  ? undefined
                  : 2
              }
              onMouseEnter={() => setIsContentHovered(true)}
              onMouseLeave={() => setIsContentHovered(false)}
            >
              {contribution.content}
            </Text>
          </Box>
          <Group>
            <Group gap={4} align="center">
              <IconClock size={16} color="#6B7280" />
              <Text size="sm" c="gray.6">
                {contribution.hours} Hours
              </Text>
            </Group>
            <Group gap={4} align="center">
              <IconCalendar size={16} color="#6B7280" />
              <Text size="sm" c="gray.6">
                {contribution.date}
              </Text>
            </Group>
            <Group gap={4} align="center">
              <IconHash size={16} color="#6B7280" />
              <Text size="sm" c="gray.6">
                {contribution.hashtag}
              </Text>
            </Group>
          </Group>
          <Group
            justify="space-between"
            align="center"
            pt={8}
            style={{ borderTop: '1px solid #DEE2E6' }}
          >
            <Group gap={16} align="center">
              <Text
                fw={600}
                size="sm"
                c={
                  contribution.status === 'pass'
                    ? '#12B886'
                    : contribution.status === 'fail'
                    ? '#9CA3AF'
                    : 'inherit'
                }
              >
                LXP {contribution.lxp}
              </Text>
            </Group>

            <Group gap={12} align="center">
              <Box
                style={getVoteItemStyle('support', userVote === 'support')}
                onClick={() => handleVote('support')}
              >
                <IconCheck size={14} />
                <Text size="sm" fw={500}>
                  {contribution.votes.support}
                </Text>
              </Box>
              <Box
                style={getVoteItemStyle('oppose', userVote === 'oppose')}
                onClick={() => handleVote('oppose')}
              >
                <IconX size={14} />
                <Text size="sm" fw={500}>
                  {contribution.votes.oppose}
                </Text>
              </Box>
              <Box
                style={getVoteItemStyle('abstain', userVote === 'abstain')}
                onClick={() => handleVote('abstain')}
              >
                <IconMinus size={14} />
                <Text size="sm" fw={500}>
                  {contribution.votes.abstain}
                </Text>
              </Box>
            </Group>
          </Group>
        </Stack>
      </Group>
    </Box>
  );
}
