import { Box, NumberInput } from '@mantine/core';
import { IconClock } from '@tabler/icons-react';

interface HoursInputProps {
  value?: number;
  onChange?: (value: number | string) => void;
}

export function HoursInput({ value, onChange }: HoursInputProps) {
  return (
    <Box
      style={{
        width: 86,
        height: 32,
        border: '1px solid #E5E7EB',
        borderRadius: 8,
        backgroundColor: '#fff',
        display: 'flex',
        alignItems: 'center',
        padding: '0 8px',
        gap: 8,
      }}
    >
      {/* todo it doesnt work due to flexbox shrinking */}
      <IconClock
        size={16}
        color="#6B7280"
        style={{ width: 16, flexShrink: 0 }}
      />
      <NumberInput
        value={value}
        onChange={onChange}
        placeholder="Hours"
        min={0}
        max={999}
        hideControls
        styles={{
          input: {
            border: 'none',
            padding: 0,
            fontSize: 14,
            fontWeight: 500,
            backgroundColor: 'transparent',
            width: '100%',
            height: 'auto',
            minHeight: 'auto',
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
        }}
      />
    </Box>
  );
}
