'use client';

import { TextInput, rem } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { useState } from 'react';
import debounce from 'lodash.debounce';

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export function SearchBar({
  placeholder = 'find a pie',
  value,
  onChange,
}: SearchBarProps) {
  const [searchValue, setSearchValue] = useState(value || '');

  const debouncedOnChange = debounce((val: string) => {
    onChange?.(val);
  }, 300);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.currentTarget.value;
    setSearchValue(newValue);
    debouncedOnChange(newValue);
  };

  return (
    <TextInput
      value={searchValue}
      onChange={handleChange}
      placeholder={placeholder}
      leftSection={
        <IconSearch style={{ width: rem(20), height: rem(20) }} stroke={1.5} />
      }
      radius="xl"
      size="lg"
    />
  );
}
