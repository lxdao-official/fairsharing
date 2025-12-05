'use client';

import { Container, Stack, Title, Text, Button, Box } from '@mantine/core';
import { IconHome } from '@tabler/icons-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <Container size="sm" py={80}>
      <Stack align="center" gap={32}>
        <Box ta="center">
          <Title order={1} size={48} fw={700} c="gray.8">
            404
          </Title>
          <Title order={2} size={24} fw={600} mt={16}>
            Page Not Found
          </Title>
          <Text size="lg" c="gray.6" mt={16} maw={400} mx="auto">
            The page you&apos;re looking for doesn&apos;t exist or may have been removed.
          </Text>
        </Box>

        <Button
          component={Link}
          href="/"
          size="md"
          leftSection={<IconHome size={16} />}
          style={{
            backgroundColor: '#FFDD44',
            color: '#000',
            fontWeight: 600,
            border: 'none',
          }}
        >
          Go to Home
        </Button>
      </Stack>
    </Container>
  );
}
