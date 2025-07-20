import { Box, Autocomplete } from '@mantine/core';
import { IconUser } from '@tabler/icons-react';

interface ContributorInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  data?: string[];
}

export function ContributorInput({
  value,
  onChange,
  placeholder = 'Contributor',
  data = ['char', 'alice', 'bob', 'charlie', 'david', 'emma', 'frank'],
}: ContributorInputProps) {
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
      <IconUser
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
            width: '8ch',
            '&:focus': {
              outline: 'none',
            },
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
