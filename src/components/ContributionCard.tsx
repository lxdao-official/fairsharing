'use client';

import {
  Box,
  Stack,
  Group,
  Avatar,
  Text,
  Badge,
  ActionIcon,
  Modal,
  Alert,
  Loader,
} from '@mantine/core';
import {
  IconEdit,
  IconClock,
  IconCalendar,
  IconHash,
  IconCheck,
  IconX,
  IconMinus,
  IconAlertCircle,
} from '@tabler/icons-react';
import { useState, useMemo } from 'react';
import { ContributionForm } from './ContributionForm';
import { trpc, type RouterOutputs } from '@/utils/trpc';
import { useUser } from '@/hooks/useAuth';
import { useUserProjects } from '@/hooks/useUserProjects';
import { useAccount, useChainId, useSignTypedData } from 'wagmi';
import {
  createVoteMessage,
  getFairsharingDomain,
  VOTE_TYPES,
} from '@/lib/eip712';

interface ContributionData {
  id: string;
  content: string;
  hours?: number | null;
  tags: string[];
  startAt?: Date | null;
  endAt?: Date | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  contributors: Array<{
    id: string;
    hours?: number | null;
    points?: number | null;
    contributor: {
      id: string;
      walletAddress: string;
      ensName?: string | null;
      name?: string | null;
      avatar?: string | null;
    };
  }>;
  votes: Array<{
    id: string;
    type: string;
    voterId: string;
  }>;
}

interface ContributionCardProps {
  contribution: ContributionData;
  projectId: string;
}

type OnChainPayload = RouterOutputs['vote']['getOnChainPayload'];

export function ContributionCard({
  contribution,
  projectId,
}: ContributionCardProps) {
  const [isContentHovered, setIsContentHovered] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [voteLoading, setVoteLoading] = useState(false);
  const [onChainProcessing, setOnChainProcessing] = useState(false);
  const [onChainError, setOnChainError] = useState<string | null>(null);

  const { user } = useUser();
  const { isValidatorForProject } = useUserProjects();
  const utils = trpc.useUtils();
  const { address } = useAccount();
  const chainId = useChainId();
  const { signTypedDataAsync } = useSignTypedData();

  // Get votes data for this contribution
  const { data: votesData } = trpc.vote.get.useQuery({
    contributionId: contribution.id,
  });

  // Get current user's vote
  const userVote = votesData?.votes.find((vote) => vote.voterId === user?.id);

  // Vote counts
  const voteCounts = votesData?.counts || { PASS: 0, FAIL: 0, SKIP: 0 };

  // Check if current user is a validator for this project
  const isValidator = isValidatorForProject(projectId);

  // Vote mutation
  const createVote = trpc.vote.create.useMutation({
    onSuccess: () => {
      // Invalidate vote data for this contribution
      utils.vote.get.invalidate({ contributionId: contribution.id });
      // Invalidate contribution list to refresh statuses
      utils.contribution.list.invalidate({ projectId });
    },
  });

  // Delete vote mutation
  const deleteVote = trpc.vote.delete.useMutation({
    onSuccess: () => {
      // Invalidate vote data for this contribution
      utils.vote.get.invalidate({ contributionId: contribution.id });
      // Invalidate contribution list to refresh statuses
      utils.contribution.list.invalidate({ projectId });
    },
  });

  // Confirm on-chain mutation
  const confirmOnChain = trpc.vote.confirmOnChain.useMutation({
    onSuccess: () => {
      utils.vote.get.invalidate({ contributionId: contribution.id });
      utils.contribution.list.invalidate({ projectId });
    },
  });

  // Check if current user is a contributor
  const isOwnContribution = useMemo(() => {
    return user
      ? contribution.contributors.some((c) => c.contributor.id === user.id)
      : false;
  }, [contribution.contributors, user]);

  // Get primary contributor (first one)
  const primaryContributor = contribution.contributors[0]?.contributor;

  // Format date - show start/end dates if available, otherwise creation date
  const formatDateRange = () => {
    if (contribution.startAt) {
      const startDate = new Date(contribution.startAt)
        .toISOString()
        .split('T')[0];
      if (contribution.endAt) {
        const endDate = new Date(contribution.endAt)
          .toISOString()
          .split('T')[0];
        // If same day, show only one date
        if (startDate === endDate) {
          return startDate;
        }
        // Different days, show range
        return `${startDate} - ${endDate}`;
      }
      return startDate;
    }
    // Fallback to creation date
    return new Date(contribution.createdAt).toISOString().split('T')[0];
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VALIDATING':
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
      case 'PASSED':
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
      case 'FAILED':
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
      case 'ON_CHAIN':
        return (
          <Badge
            size="sm"
            style={{
              backgroundColor: '#E0E7FF',
              color: '#3730A3',
              border: 'none',
            }}
          >
            On-Chain
          </Badge>
        );
      default:
        return null;
    }
  };

  // Get vote button style
  const getVoteItemStyle = (
    voteType: 'PASS' | 'FAIL' | 'SKIP',
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

    const isDisabled =
      contribution.status !== 'VALIDATING' || !user || (isOwnContribution && !isValidator);

    if (isDisabled && !isActive) {
      return {
        ...baseStyle,
        backgroundColor: 'transparent',
        color: '#9CA3AF',
        cursor: 'not-allowed',
      };
    }

    switch (voteType) {
      case 'PASS':
        return {
          ...baseStyle,
          backgroundColor: isActive ? '#10B981' : 'transparent',
          color: isActive ? 'white' : '#10B981',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
        };
      case 'FAIL':
        return {
          ...baseStyle,
          backgroundColor: isActive ? '#EF4444' : 'transparent',
          color: isActive ? 'white' : '#EF4444',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
        };
      case 'SKIP':
        return {
          ...baseStyle,
          backgroundColor: isActive ? '#6B7280' : 'transparent',
          color: isActive ? 'white' : '#6B7280',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
        };
    }
  };

  const submitOnChainVerification = async (
    payload: OnChainPayload,
  ): Promise<string> => {
    // TODO: Replace this placeholder with an actual contract call using wagmi writeContract
    console.log('[OnChainVerification] Prepared payload', payload);
    await new Promise(resolve => setTimeout(resolve, 500));
    return `mock-tx-${Date.now()}`;
  };

  const verifyOnChain = async () => {
    if (onChainProcessing) {
      return false;
    }

    setOnChainProcessing(true);
    setOnChainError(null);

    try {
      const payload = await utils.vote.getOnChainPayload.fetch({
        contributionId: contribution.id,
      });
      const txHash = await submitOnChainVerification(payload);
      await confirmOnChain.mutateAsync({
        contributionId: contribution.id,
        txHash,
      });
      return true;
    } catch (error) {
      console.error('Failed to verify contribution on-chain', error);
      setOnChainError(
        'Failed to verify contribution on-chain automatically.',
      );
      return false;
    } finally {
      setOnChainProcessing(false);
    }
  };

  // Handle vote
  const handleVote = async (voteType: 'PASS' | 'FAIL' | 'SKIP') => {
    if (
      contribution.status !== 'VALIDATING' ||
      !user ||
      (isOwnContribution && !isValidator) ||
      voteLoading
    )
      return;

    setVoteLoading(true);
    setOnChainError(null);

    // If user already voted with same type, remove vote
    if (userVote?.type === voteType) {
      try {
        await deleteVote.mutateAsync({ contributionId: contribution.id });
      } finally {
        setVoteLoading(false);
      }
      return;
    }

    if (!address) {
      setVoteLoading(false);
      return;
    }

    try {
      // Create EIP-712 vote message
      const voteMessage = createVoteMessage({
        contributionId: contribution.id,
        projectId,
        voteType,
        voterAddress: address,
      });

      // Get domain for current chain
      const domain = getFairsharingDomain(chainId);

      // Sign using EIP-712
      const signature = await signTypedDataAsync({
        domain,
        types: VOTE_TYPES,
        primaryType: 'Vote',
        message: voteMessage,
      });

      // Submit vote to backend
      const response = await createVote.mutateAsync({
        contributionId: contribution.id,
        type: voteType,
        signature,
        signatureType: 'EIP712',
        signaturePayload: voteMessage,
        chainId: chainId.toString(),
      });

      if (response?.decision?.justPassed && voteType === 'PASS') {
        await verifyOnChain();
      }
    } catch (error) {
      console.error('Failed to submit vote', error);
      setOnChainError(
        error instanceof Error ? error.message : 'Failed to submit vote. Please try again.',
      );
    } finally {
      setVoteLoading(false);
    }
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
        <Avatar
          src={primaryContributor?.avatar || '/homepage/step2-icon.png'}
          size={40}
          radius="50%"
        />
        <Stack gap={8} style={{ flex: 1 }}>
          <Group justify="space-between">
            <Text fw={600} size="md">
              {primaryContributor?.name ||
                primaryContributor?.ensName ||
                `${primaryContributor?.walletAddress.slice(
                  0,
                  6,
                )}...${primaryContributor?.walletAddress.slice(-4)}`}
            </Text>
            <Group align="center">
              {getStatusBadge(contribution.status)}
              {isOwnContribution && contribution.status !== 'PASSED' && (
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="sm"
                  onClick={() => setIsEditModalOpen(true)}
                >
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
            {contribution.hours && (
              <Group gap={4} align="center">
                <IconClock size={16} color="#6B7280" />
                <Text size="sm" c="gray.6">
                  {contribution.hours} Hours
                </Text>
              </Group>
            )}
            <Group gap={4} align="center">
              <IconCalendar size={16} color="#6B7280" />
              <Text size="sm" c="gray.6">
                {formatDateRange()}
              </Text>
            </Group>
            {contribution.tags.length > 0 && (
              <Group gap={4} align="center">
                <IconHash size={16} color="#6B7280" />
                <Text size="sm" c="gray.6">
                  {contribution.tags[0]}
                </Text>
              </Group>
            )}
          </Group>

          <Group
            justify="space-between"
            align="center"
            pt={8}
            style={{ borderTop: '1px solid #DEE2E6' }}
          >
            <Group gap={16} align="center">
              <Text fw={600} size="sm">
                {contribution.contributors.reduce(
                  (sum, c) => sum + (c.points || 0),
                  0,
                )}{' '}
                LXP
              </Text>
            </Group>

            <Group gap={12} align="center">
              {voteLoading ? (
                <Loader size="sm" />
              ) : (
                <>
                  <Box
                    style={getVoteItemStyle('PASS', userVote?.type === 'PASS')}
                    onClick={() => void handleVote('PASS')}
                  >
                    <IconCheck size={14} />
                    <Text size="sm" fw={500}>
                      {voteCounts.PASS}
                    </Text>
                  </Box>
                  <Box
                    style={getVoteItemStyle('FAIL', userVote?.type === 'FAIL')}
                    onClick={() => void handleVote('FAIL')}
                  >
                    <IconX size={14} />
                    <Text size="sm" fw={500}>
                      {voteCounts.FAIL}
                    </Text>
                  </Box>
                  <Box
                    style={getVoteItemStyle('SKIP', userVote?.type === 'SKIP')}
                    onClick={() => void handleVote('SKIP')}
                  >
                    <IconMinus size={14} />
                    <Text size="sm" fw={500}>
                      {voteCounts.SKIP}
                    </Text>
                  </Box>
                </>
              )}
            </Group>
          </Group>
        </Stack>
      </Group>

      {onChainProcessing && (
        <Box mt={12}>
          <Alert
            color="blue"
            variant="light"
            icon={<Loader size="1rem" />}
          >
            Submitting verification transaction...
          </Alert>
        </Box>
      )}

      {onChainError && (
        <Box mt={12}>
          <Alert
            color="red"
            variant="light"
            icon={<IconAlertCircle size="1rem" />}
          >
            {onChainError}
          </Alert>
        </Box>
      )}

      {/* Edit Modal */}
      <Modal
        opened={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Contribution"
        size="lg"
        centered
      >
        <Stack gap={16}>
          <Alert
            icon={<IconAlertCircle size="1rem" />}
            title="You're editing this contribution."
            color="yellow"
            variant="light"
          >
            Submitting changes will restart the vote and erase all previous
            votes.
          </Alert>

          <ContributionForm
            projectId={projectId}
            isEditMode={true}
            initialData={{
              id: contribution.id,
              contribution: contribution.content,
              hours: contribution.hours || 0,
              contributor: primaryContributor?.name || '',
              date: [
                contribution.startAt
                  ? new Date(contribution.startAt)
                  : new Date(contribution.createdAt),
                contribution.endAt ? new Date(contribution.endAt) : null,
              ] as [Date | null, Date | null],
              hashtag: contribution.tags[0] || '',
              reward: contribution.contributors.reduce(
                (sum, c) => sum + (c.points || 0),
                0,
              ),
            }}
            onSubmit={() => {
              setIsEditModalOpen(false);
              utils.contribution.list.invalidate({ projectId });
            }}
            onCancel={() => setIsEditModalOpen(false)}
          />
        </Stack>
      </Modal>
    </Box>
  );
}
