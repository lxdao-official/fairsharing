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
} from '@mantine/core';
import { HoursInput } from '@/components/HoursInput';
import { ContributorInput } from '@/components/ContributorInput';
import { DatePickerInput } from '@/components/DatePickerInput';
import { HashtagInput } from '@/components/HashtagInput';
import { useState } from 'react';
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
  const [contributor, setContributor] = useState(
    initialData.contributor || 'char',
  );
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
  
  const { user } = useUser();
  const utils = trpc.useUtils();
  
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

  const handleSubmit = () => {
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
      contributors: [{
        userId: user.id,
        hours: typeof hours === 'number' ? hours : Number(hours) || undefined,
        points: typeof reward === 'number' ? reward : Number(reward) || undefined,
      }],
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
  };

  return (
    <Box
      style={{
        borderRadius: isEditMode ? '0px' : '16px',
        border: isEditMode ? 'none' : '1px solid #FFDD44',
        padding: isEditMode ? '0px' : '20px',
        width: '100%',
        maxWidth: '100%',
      }}
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

        {/* Form Fields Row */}
        <Group gap={16}>
          {/* Hours */}
          <Box style={{ flex: '0 0 auto' }}>
            <HoursInput
              value={typeof hours === 'number' ? hours : undefined}
              onChange={setHours}
            />
          </Box>

          {/* Contributor */}
          <Box style={{ width: 'auto', minWidth: 86 }}>
            <ContributorInput
              value={contributor}
              onChange={setContributor}
              placeholder="Contributor"
            />
          </Box>

          {/* Date */}
          <Box style={{ minWidth: 86 }}>
            <DatePickerInput
              value={date}
              onChange={setDate}
              placeholder="Select date"
            />
          </Box>

          {/* Hashtag */}
          <Box style={{ minWidth: 86 }}>
            <HashtagInput
              value={hashtag}
              onChange={setHashtag}
              placeholder="Optional"
            />
          </Box>
        </Group>
        
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
            <Text>LXP</Text>
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
                ) : (
                  isEditMode ? 'Update' : 'Submit'
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
              {loading ? (
                <Loader size="sm" />
              ) : (
                'Submit'
              )}
            </Button>
          )}
        </Group>
      </Stack>
    </Box>
  );
}
