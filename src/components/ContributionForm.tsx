import {
  Box,
  Textarea,
  Group,
  Button,
  Text,
  Stack,
  NumberInput,
} from '@mantine/core';
import { HoursInput } from '@/components/HoursInput';
import { ContributorInput } from '@/components/ContributorInput';
import { DatePickerInput } from '@/components/DatePickerInput';
import { HashtagInput } from '@/components/HashtagInput';
import { useState } from 'react';

interface ContributionFormData {
  contribution: string;
  hours: number;
  contributor: string;
  date: [Date | null, Date | null];
  hashtag: string;
  reward: number;
}

interface ContributionFormProps {
  isEditMode?: boolean;
  initialData?: Partial<ContributionFormData>;
  onSubmit?: (data: ContributionFormData) => void;
  onCancel?: () => void;
}

export function ContributionForm({
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

  const handleSubmit = () => {
    const formData: ContributionFormData = {
      contribution,
      hours: typeof hours === 'number' ? hours : Number(hours) || 0,
      contributor,
      date,
      hashtag,
      reward: typeof reward === 'number' ? reward : Number(reward) || 0,
    };

    if (onSubmit) {
      onSubmit(formData);
    } else {
      console.log('Submitting contribution:', formData);
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
                Submit
              </Button>
            </Group>
          ) : (
            <Button
              onClick={handleSubmit}
              size="md"
              radius="md"
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
              Submit
            </Button>
          )}
        </Group>
      </Stack>
    </Box>
  );
}
