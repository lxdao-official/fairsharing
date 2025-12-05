import { Box, Autocomplete } from '@mantine/core';
import { IconHash } from '@tabler/icons-react';

interface HashtagInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  data?: string[];
}

export function HashtagInput({
  value,
  onChange,
  placeholder = 'Hashtag',
  data = [
    'development',
    'design',
    'research',
    'testing',
    'documentation',
    'meeting',
    'review',
  ],
}: HashtagInputProps) {
  return (
    <Box
      style={{
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
      <IconHash
        size={16}
        color="#6B7280"
        style={{ width: 16, flexShrink: 0 }}
      />
      <Autocomplete
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        data={data}
        limit={5}
        styles={{
          input: {
            border: 'none',
            padding: 0,
            fontSize: 14,
            fontWeight: 500,
            backgroundColor: 'transparent',
            width: '100%',
            minWidth: '12ch',
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
          dropdown: {
            border: '1px solid #E5E7EB',
            borderRadius: 8,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            minWidth: 150,
            width: 'max-content',
          },
          option: {
            fontSize: 14,
            padding: '8px 12px',
            whiteSpace: 'nowrap',
            '&[dataSelected="true"]': {
              backgroundColor: '#F3F4F6',
              color: '#111827',
            },
            '&:hover': {
              backgroundColor: '#F9FAFB',
            },
          },
        }}
      />
    </Box>
  );
}
