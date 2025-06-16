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
        valueFormat="YYYY-MM-DD"
        type="range"
        allowSingleDateInRange
        placeholder={placeholder}
        leftSection={<IconCalendar size={16} color="#6B7280" />}
        presets={[
          {
            value: [dayjs().subtract(1, 'day').format('YYYY-MM-DD'), null],
            label: 'Yesterday',
          },
          { value: [dayjs().format('YYYY-MM-DD'), null], label: 'Today' },
          {
            value: [dayjs().add(1, 'day').format('YYYY-MM-DD'), null],
            label: 'Tomorrow',
          },
          {
            value: [dayjs().subtract(1, 'week').format('YYYY-MM-DD'), null],
            label: 'Last week',
          },
          {
            value: [dayjs().subtract(1, 'month').format('YYYY-MM-DD'), null],
            label: 'Last month',
          },
        ]}
        styles={{
          input: {
            border: 'none',
            padding: '0 8px',
            fontSize: 14,
            fontWeight: 500,
            backgroundColor: 'transparent',
            width: '100%',
            height: 32,
            minHeight: 32,
            '&:focus': {
              outline: 'none',
            },
          },
          wrapper: {
            width: '100%',
          },
          root: {
            width: '100%',
          },
          section: {
            marginLeft: 8,
          },
        }}
      />
    </Box>
  );
}
