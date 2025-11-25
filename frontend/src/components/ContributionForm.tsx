'use client';

import {
  Box,
  Textarea,
  Group,
  Button,
  Text,
  Stack,
  NumberInput,
  Alert,
  Loader,
  Tooltip,
  SimpleGrid,
  Container,
} from '@mantine/core';
import { HoursInput } from '@/components/HoursInput';
import { ContributorInput } from '@/components/ContributorInput';
import { DatePickerInput } from '@/components/DatePickerInput';
import { HashtagInput } from '@/components/HashtagInput';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { IconCheck, IconX } from '@tabler/icons-react';
import { useUser } from '@/hooks/useAuth';

interface ContributionFormData {
  id?: string;
  contribution: string;
  hours: number;
  contributor: string;
  date: [Date | null, Date | null];
  hashtag: string;
  reward: number;
}

interface ContributionFormProps {
  projectId?: string;
  isEditMode?: boolean;
  initialData?: Partial<ContributionFormData>;
  onSubmit?: (data: ContributionFormData) => void;
  onCancel?: () => void;
}

export function ContributionForm({
  projectId,
  isEditMode = false,
  initialData = {},
  onSubmit,
  onCancel,
}: ContributionFormProps) {
  const [contribution, setContribution] = useState(
    initialData.contribution || '',
  );
  const [hours, setHours] = useState<number | string>(initialData.hours || '');
  const [date, setDate] = useState<[Date | null, Date | null]>(
    initialData.date || [new Date(), null],
  );
  const [hashtag, setHashtag] = useState(initialData.hashtag || '');
  const [reward, setReward] = useState<number | string>(
    initialData.reward || 0,
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const formRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();
  const utils = trpc.useUtils();

  // Fetch project data to get members and submission strategy
  const { data: projectData } = trpc.project.get.useQuery(
    { id: projectId || '' },
    { enabled: !!projectId },
  );

  // Determine contributor options based on project settings
  const contributorOptions = useMemo(() => {
    if (!projectData) return [];

    const options = [];

    // Always include current user if authenticated
    if (user) {
      options.push({
        value: user.id,
        label:
          user.name ||
          user.ensName ||
          `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`,
      });
    }

    // If submission strategy allows, include project members
    if (
      projectData.submitStrategy === 'EVERYONE' ||
      projectData.submitStrategy === 'RESTRICTED'
    ) {
      projectData.members?.forEach((member: any) => {
        if (member.user.id !== user?.id) {
          // Avoid duplicates
          options.push({
            value: member.user.id,
            label:
              member.user.name ||
              member.user.ensName ||
              `${member.user.walletAddress.slice(
                0,
                6,
              )}...${member.user.walletAddress.slice(-4)}`,
          });
        }
      });
    }

    return options;
  }, [projectData, user]);

  // Helper to get user ID from label
  const getContributorId = useCallback(
    (label: string) => {
      const option = contributorOptions.find((opt) => opt.label === label);
      return option ? option.value : label;
    },
    [contributorOptions],
  );

  const [contributor, setContributor] = useState(initialData.contributor || '');

  // Update contributor when user or contributorOptions change
  useEffect(() => {
    if (!contributor && user && contributorOptions.length > 0) {
      const userOption = contributorOptions.find(
        (opt) => opt.value === user.id,
      );
      if (userOption) {
        setContributor(userOption.label);
      }
    }
  }, [user, contributorOptions, contributor]);

  // Auto-calculate points based on hours
  useEffect(() => {
    if (hours && typeof hours === 'number' && hours > 0) {
      // Calculate points based on default rate (10 points per hour)
      const pointsPerHour = 10; // Default 10 points per hour
      const calculatedPoints = Math.round(hours * pointsPerHour);
      setReward(calculatedPoints);
    } else if (typeof hours === 'string' && hours !== '') {
      const hoursNum = Number(hours);
      if (!isNaN(hoursNum) && hoursNum > 0) {
        const pointsPerHour = 10;
        const calculatedPoints = Math.round(hoursNum * pointsPerHour);
        setReward(calculatedPoints);
      }
    }
  }, [hours]);

  const createContribution = trpc.contribution.create.useMutation({
    onSuccess: () => {
      setSuccess('Contribution submitted successfully!');
      setError(null);
      // Reset form
      setContribution('');
      setHours('');
      setDate([new Date(), null]);
      setHashtag('');
      setReward(0);
      // Refresh contributions list
      if (projectId) {
        utils.contribution.list.invalidate({ projectId });
      }
      void utils.user.getSidebarProjects.invalidate();
    },
    onError: (error) => {
      setError(error.message);
      setSuccess(null);
    },
    onSettled: () => {
      setLoading(false);
    },
  });

  const updateContribution = trpc.contribution.update.useMutation({
    onSuccess: () => {
      setSuccess('Contribution updated successfully!');
      setError(null);
      if (onSubmit) {
        onSubmit({
          contribution,
          hours: typeof hours === 'number' ? hours : Number(hours) || 0,
          contributor,
          date,
          hashtag,
          reward: typeof reward === 'number' ? reward : Number(reward) || 0,
        });
      }
    },
    onError: (error) => {
      setError(error.message);
      setSuccess(null);
    },
    onSettled: () => {
      setLoading(false);
    },
  });

  const handleSubmit = useCallback(() => {

    if (!user) {
      setError('You must be logged in to submit a contribution');
      return;
    }

    if (!projectId && !isEditMode) {
      setError('Project ID is required');
      return;
    }

    if (!contribution.trim()) {
      setError('Contribution content is required');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const formData = {
      content: contribution,
      hours: typeof hours === 'number' ? hours : Number(hours) || undefined,
      tags: hashtag ? [hashtag] : [],
      startAt: date[0] || undefined,
      endAt: date[1] || undefined,
      contributors: [
        {
          userId: getContributorId(contributor) || user?.id || '',
          hours: typeof hours === 'number' ? hours : Number(hours) || undefined,
          points:
            typeof reward === 'number' ? reward : Number(reward) || undefined,
        },
      ],
    };

    if (isEditMode && initialData?.id) {
      updateContribution.mutate({
        id: initialData.id,
        ...formData,
      });
    } else if (projectId) {
      createContribution.mutate({
        projectId,
        ...formData,
      });
    }
  }, [
    user,
    projectId,
    isEditMode,
    contribution,
    hours,
    date,
    hashtag,
    reward,
    contributor,
    getContributorId,
    initialData?.id,
    updateContribution,
    createContribution,
  ]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        handleSubmit();
      }
    };

    const formElement = formRef.current;
    if (formElement) {
      formElement.addEventListener('keydown', handleKeyDown);
      return () => {
        formElement.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [handleSubmit]);

  return (
    <Box
      ref={formRef}
      style={{
        borderRadius: isEditMode ? '0px' : '16px',
        border: isEditMode ? 'none' : '1px solid #FFDD44',
        padding: isEditMode ? '0px' : '20px',
        width: '100%',
        maxWidth: '100%',
      }}
      tabIndex={-1}
    >
      <Stack gap={20}>
        {/* Main contribution */}
        <Textarea
          placeholder="What have you done recently?"
          value={contribution}
          onChange={(e) => setContribution(e.target.value)}
          minRows={3}
          maxRows={5}
          autosize
          styles={{
            input: {
              border: 'none',
              padding: 0,
            },
          }}
        />

        {/* Form Fields - Responsive Layout */}
        <Container size="100%" p={0}>
          <SimpleGrid
            cols={{ base: 1, xs: 2, sm: 4 }}
            spacing={{ base: 12, sm: 16 }}
            verticalSpacing={{ base: 12, sm: 16 }}
          >
            {/* Hours */}
            <Box style={{ minWidth: 0 }}>
              <HoursInput
                value={typeof hours === 'number' ? hours : undefined}
                onChange={setHours}
              />
            </Box>

            {/* Contributor */}
            <Box style={{ minWidth: 0 }}>
              <ContributorInput
                value={contributor}
                onChange={setContributor}
                placeholder="Contributor"
                data={contributorOptions.map((option) => option.label)}
              />
            </Box>

            {/* Date */}
            <Box style={{ minWidth: 0 }}>
              <DatePickerInput
                value={date}
                onChange={setDate}
                placeholder="Select date"
              />
            </Box>

            {/* Hashtag */}
            <Box style={{ minWidth: 0 }}>
              <HashtagInput
                value={hashtag}
                onChange={setHashtag}
                placeholder="Optional"
              />
            </Box>
          </SimpleGrid>
        </Container>

        {/* Error/Success Messages */}
        {error && (
          <Alert color="red" icon={<IconX size={16} />} variant="light">
            {error}
          </Alert>
        )}

        {success && (
          <Alert color="green" icon={<IconCheck size={16} />} variant="light">
            {success}
          </Alert>
        )}

        {/* Reward Section */}
        <Group
          justify="space-between"
          align="center"
          pt={16}
          style={{ borderTop: '1px solid #F3F4F6' }}
        >
          <Group gap={16} align="center">
            <Text>The contribution deserves:</Text>
            <NumberInput
              value={reward}
              onChange={setReward}
              min={0}
              hideControls
              styles={{
                root: {
                  width: '60px',
                },
                input: {
                  border: 'none',
                  borderRadius: '8px',
                  padding: 0,
                  '&:focus': {
                    borderColor: '#3B82F6',
                  },
                },
              }}
            />
            <Tooltip
              label={`Auto-calculated: 10 points per hour`}
              position="top"
            >
              <Text style={{ cursor: 'help' }}>
                {projectData?.tokenSymbol || 'Points'}
              </Text>
            </Tooltip>
          </Group>

          {isEditMode ? (
            <Group gap={12}>
              <Button
                variant="subtle"
                color="gray"
                onClick={onCancel}
                size="md"
                radius="md"
                style={{
                  fontWeight: 600,
                  paddingInline: '24px',
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                size="md"
                radius="md"
                loading={loading}
                disabled={loading || !user}
                style={{
                  backgroundColor: '#FFDD44',
                  color: '#000',
                  fontWeight: 600,
                  border: 'none',
                  '&:hover': {
                    backgroundColor: '#FDD835',
                  },
                  paddingInline: '32px',
                }}
              >
                {loading ? (
                  <Loader size="sm" />
                ) : isEditMode ? (
                  'Update'
                ) : (
                  'Submit'
                )}
              </Button>
            </Group>
          ) : (
            <Button
              onClick={handleSubmit}
              size="md"
              radius="md"
              loading={loading}
              disabled={loading || !user || !projectId}
              style={{
                backgroundColor: '#FFDD44',
                color: '#000',
                fontWeight: 600,
                border: 'none',
                '&:hover': {
                  backgroundColor: '#FDD835',
                },
                paddingInline: '32px',
              }}
            >
              {loading ? <Loader size="sm" /> : 'Submit'}
            </Button>
          )}
        </Group>
      </Stack>
    </Box>
  );
}
