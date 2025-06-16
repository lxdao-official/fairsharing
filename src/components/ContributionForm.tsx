import {
  Box,
  Textarea,
  Group,
  TextInput,
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

export function ContributionForm() {
  const [contribution, setContribution] = useState('');
  const [hours, setHours] = useState<number | string>('');
  const [contributor, setContributor] = useState('char');
  const [date, setDate] = useState<[Date | null, Date | null]>([
    new Date(),
    null,
  ]);
  const [hashtag, setHashtag] = useState('');
  const [reward, setReward] = useState<number | string>(0);

  const handleSubmit = () => {
    console.log('Submitting contribution:', {
      contribution,
      hours,
      contributor,
      date,
      hashtag,
      reward,
    });
  };

  return (
    <Box
      style={{
        borderRadius: '16px',
        border: '1px solid #FFDD44',
        padding: '20px',
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
              placeholder="0"
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
      </Stack>
    </Box>
  );
}
