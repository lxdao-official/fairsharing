import { Loader, Stack, Text } from '@mantine/core';

interface LoadingSpinnerProps {
  text?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export function LoadingSpinner({ text = 'Loading...', size = 'md' }: LoadingSpinnerProps) {
  return (
    <Stack align="center" justify="center" gap={16} py={40}>
      <Loader size={size} color="yellow" />
      <Text size="sm" c="gray.6">
        {text}
      </Text>
    </Stack>
  );
}