import { Box } from '@mantine/core';
import { DatePickerInput as MantineDatePickerInput } from '@mantine/dates';
import { IconCalendar } from '@tabler/icons-react';
import dayjs from 'dayjs';

interface DatePickerInputProps {
  value?: [Date | null, Date | null];
  onChange?: (value: [Date | null, Date | null]) => void;
  placeholder?: string;
}

export function DatePickerInput({
  value,
  onChange,
  placeholder = 'Select date',
}: DatePickerInputProps) {
  return (
    <Box
      style={{
        height: 32,
        border: '1px solid #E5E7EB',
        borderRadius: 8,
        backgroundColor: '#fff',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
      }}
    >
      <MantineDatePickerInput
        value={value}
        onChange={(dateStrings: [string | null, string | null]) => {
          const dates: [Date | null, Date | null] = [
            dateStrings[0] ? new Date(dateStrings[0]) : null,
            dateStrings[1] ? new Date(dateStrings[1]) : null,
          ];
          onChange?.(dates);
        }}
        type="range"
        allowSingleDateInRange
        placeholder={placeholder}
        leftSection={<IconCalendar size={16} color="#6B7280" />}
        leftSectionProps={{
          style: {
            width: '16px',
          },
        }}
        presets={[
          {
            value: [
              dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
              dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
            ],
            label: 'Yesterday',
          },
          {
            value: [dayjs().format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')],
            label: 'Today',
          },
          {
            value: [
              dayjs().add(1, 'day').format('YYYY-MM-DD'),
              dayjs().add(1, 'day').format('YYYY-MM-DD'),
            ],
            label: 'Tomorrow',
          },
          {
            value: [
              dayjs().subtract(1, 'week').format('YYYY-MM-DD'),
              dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
            ],
            label: 'Last week',
          },
          {
            value: [
              dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
              dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
            ],
            label: 'Last month',
          },
        ]}
        valueFormat="MMM DD"
        styles={{
          input: {
            border: 'none',
            fontSize: 14,
            fontWeight: 500,
            backgroundColor: 'transparent',
            width: '100%',
            minWidth: '20ch',
            color:
              value &&
              value[0] &&
              value[1] &&
              dayjs(value[0]).isSame(dayjs(value[1]), 'day')
                ? 'transparent'
                : 'inherit',
            '&:focus': {
              outline: 'none',
            },
            '&::placeholder': {
              color: '#9CA3AF',
            },
          },
          section: {
            marginLeft: 8,
          },
        }}
      />
      {/* Custom display overlay for same-day ranges */}
      {value &&
        value[0] &&
        value[1] &&
        dayjs(value[0]).isSame(dayjs(value[1]), 'day') && (
          <div
            style={{
              position: 'absolute',
              left: '34px', // Account for icon + margin
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 14,
              fontWeight: 500,
              color: '#000',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            {dayjs(value[0]).format('MMM DD')}
          </div>
        )}
    </Box>
  );
}
