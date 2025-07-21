'use client';

import {
  Box,
  Stack,
  Group,
  Text,
  Badge,
  Avatar,
  Alert,
  Title,
} from '@mantine/core';
import {
  IconUsers,
  IconUserCheck,
  IconInfoCircle,
  IconShield,
} from '@tabler/icons-react';
import { trpc } from '@/utils/trpc';
import { useUser } from '@/hooks/useAuth';

interface ProjectData {
  id: string;
  validateType: string;
  members: Array<{
    id: string;
    role: string[];
    user: {
      id: string;
      walletAddress: string;
      ensName?: string | null;
      name?: string | null;
      avatar?: string | null;
    };
  }>;
}

interface VotingEligibilityPanelProps {
  project: ProjectData;
}

export function VotingEligibilityPanel({ project }: VotingEligibilityPanelProps) {
  const { user } = useUser();

  // Get eligible voters based on project settings
  const eligibleVoters = project.validateType === 'SPECIFIC_MEMBERS'
    ? project.members.filter(member => member.role.includes('VALIDATOR'))
    : project.members;

  // Check if current user can vote
  const currentUserMember = project.members.find(member => member.user.id === user?.id);
  const canCurrentUserVote = currentUserMember && (
    project.validateType === 'ALL_MEMBERS' ||
    (project.validateType === 'SPECIFIC_MEMBERS' && currentUserMember.role.includes('VALIDATOR'))
  );

  // Get validation strategy description
  const getValidationDescription = () => {
    switch (project.validateType) {
      case 'SPECIFIC_MEMBERS':
        return {
          title: 'Validator Review',
          description: 'Only designated validators can review and vote on contributions',
          icon: <IconShield size={16} color="#3B82F6" />,
          color: 'blue',
        };
      case 'ALL_MEMBERS':
        return {
          title: 'Member Democracy',
          description: 'All project members can participate in voting',
          icon: <IconUsers size={16} color="#10B981" />,
          color: 'green',
        };
      default:
        return {
          title: 'Unknown Strategy',
          description: 'Validation strategy not configured',
          icon: <IconInfoCircle size={16} color="#6B7280" />,
          color: 'gray',
        };
    }
  };

  const strategyInfo = getValidationDescription();

  return (
    <Box
      style={{
        backgroundColor: '#F8FAFC',
        border: '1px solid #E2E8F0',
        borderRadius: 16,
        padding: 20,
      }}
    >
      <Stack gap={16}>
        {/* Header */}
        <Group justify="space-between" align="flex-start">
          <Stack gap={8}>
            <Group gap={8} align="center">
              {strategyInfo.icon}
              <Title order={4} size="lg" fw={600}>
                Voting Eligibility
              </Title>
            </Group>
            <Badge
              size="sm"
              color={strategyInfo.color}
              variant="light"
              style={{ alignSelf: 'flex-start' }}
            >
              {strategyInfo.title}
            </Badge>
          </Stack>
          
          <Group gap={16} align="center">
            <Stack gap={4} align="center">
              <Group gap={4} align="center">
                <IconUserCheck size={16} color="#6B7280" />
                <Text size="sm" fw={600} c="gray.7">
                  Eligible Voters
                </Text>
              </Group>
              <Text size="xl" fw={700} c="gray.9">
                {eligibleVoters.length}
              </Text>
            </Stack>
          </Group>
        </Group>

        {/* Description */}
        <Text size="sm" c="gray.6" style={{ maxWidth: 500 }}>
          {strategyInfo.description}
        </Text>

        {/* Current User Status */}
        {user && (
          <Alert
            icon={<IconInfoCircle size={16} />}
            color={canCurrentUserVote ? 'green' : 'orange'}
            variant="light"
            style={{ marginTop: 8 }}
          >
            <Group justify="space-between" align="center">
              <Text size="sm" fw={500}>
                {canCurrentUserVote 
                  ? '✅ You can vote on contributions in this project'
                  : '⚠️ You cannot vote on contributions in this project'
                }
              </Text>
              {!canCurrentUserVote && currentUserMember && (
                <Text size="xs" c="gray.6">
                  {project.validateType === 'SPECIFIC_MEMBERS' 
                    ? 'Only validators can vote'
                    : 'You need to be a project member'
                  }
                </Text>
              )}
            </Group>
          </Alert>
        )}

        {/* Eligible Voters List */}
        {eligibleVoters.length > 0 && (
          <Stack gap={12}>
            <Text size="sm" fw={600} c="gray.7">
              Eligible Voters ({eligibleVoters.length})
            </Text>
            <Group gap={12} wrap="wrap">
              {eligibleVoters.slice(0, 8).map((member) => (
                <Group
                  key={member.id}
                  gap={8}
                  align="center"
                  style={{
                    backgroundColor: 'white',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <Avatar
                    src={member.user.avatar || '/homepage/step2-icon.png'}
                    size={24}
                    radius="50%"
                  />
                  <Text size="sm" fw={500}>
                    {member.user.name ||
                     member.user.ensName ||
                     `${member.user.walletAddress.slice(0, 6)}...${member.user.walletAddress.slice(-4)}`}
                  </Text>
                  {project.validateType === 'SPECIFIC_MEMBERS' && (
                    <Badge size="xs" color="blue" variant="light">
                      Validator
                    </Badge>
                  )}
                </Group>
              ))}
              {eligibleVoters.length > 8 && (
                <Text size="sm" c="gray.5">
                  +{eligibleVoters.length - 8} more
                </Text>
              )}
            </Group>
          </Stack>
        )}
      </Stack>
    </Box>
  );
}