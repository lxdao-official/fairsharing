'use client';

import { useState, useEffect } from 'react';
import { TextInput, Text, Box } from '@mantine/core';
import { IconCheck, IconX, IconUser } from '@tabler/icons-react';

interface AddressInputProps {
  value?: string;
  onChange?: (value: string) => void;
  label?: React.ReactNode;
  placeholder?: string;
  description?: React.ReactNode;
  required?: boolean;
  error?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  radius?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  style?: React.CSSProperties;
  disabled?: boolean;
}

// Validation functions
const isValidEthereumAddress = (address: string): boolean => {
  // Check if it's a valid Ethereum address format
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) return false;

  // Additional checksum validation could be added here
  return true;
};

const isValidENS = (ens: string): boolean => {
  // Support .eth and other common ENS domains
  // ENS names should be at least 3 characters (including domain)
  if (ens.length < 7) return false; // minimum: "a.eth" = 5 chars, but we want at least 3 chars before .eth

  // Check for valid ENS format
  return /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.(eth|xyz|luxe|kred|art)$/.test(
    ens,
  );
};

const getAddressType = (
  input: string,
): 'address' | 'ens' | 'invalid' | 'empty' => {
  if (!input || input.trim() === '') return 'empty';
  if (isValidEthereumAddress(input)) return 'address';
  if (isValidENS(input)) return 'ens';
  return 'invalid';
};

const getValidationMessage = (
  type: 'address' | 'ens' | 'invalid' | 'empty',
): { message: string; color: string; icon: React.ReactNode } => {
  switch (type) {
    case 'address':
      return {
        message: 'Valid Ethereum address',
        color: '#10B981',
        icon: <IconCheck size={16} color="#10B981" />,
      };
    case 'ens':
      return {
        message: 'Valid ENS domain',
        color: '#10B981',
        icon: <IconCheck size={16} color="#10B981" />,
      };
    case 'invalid':
      return {
        message:
          'Invalid format. Please enter a valid Ethereum address (0x...) or ENS domain (.eth)',
        color: '#EF4444',
        icon: <IconX size={16} color="#EF4444" />,
      };
    case 'empty':
      return {
        message: '',
        color: '#6B7280',
        icon: <IconUser size={16} color="#6B7280" />,
      };
  }
};

export function AddressInput({
  value = '',
  onChange,
  label,
  placeholder = '0x1234... or username.eth',
  description,
  required = false,
  error,
  size = 'sm',
  radius = 'sm',
  style,
  disabled,
}: AddressInputProps) {
  const [inputValue, setInputValue] = useState(value);
  const [validationType, setValidationType] = useState<
    'address' | 'ens' | 'invalid' | 'empty'
  >('empty');

  useEffect(() => {
    setInputValue(value);
    setValidationType(getAddressType(value));
  }, [value]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setInputValue(newValue);

    const type = getAddressType(newValue);
    setValidationType(type);

    onChange?.(newValue);
  };

  const validation = getValidationMessage(validationType);
  const showValidation = inputValue.trim() !== '' && !error;
  const showValidationMessage = showValidation && validationType === 'invalid';

  return (
    <Box style={style}>
      <TextInput
        label={label}
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        description={description}
        disabled={disabled}
        required={required}
        error={error}
        size={size}
        radius={radius}
        rightSection={showValidation ? validation.icon : undefined}
        styles={{
          input: {
            borderColor: error
              ? '#EF4444'
              : showValidation && validationType === 'invalid'
              ? '#EF4444'
              : undefined,
          },
        }}
      />

      {showValidationMessage && validation.message && (
        <Text
          size="xs"
          style={{
            color: validation.color,
            marginTop: 4,
            fontSize: 12,
          }}
        >
          {validation.message}
        </Text>
      )}
    </Box>
  );
}
