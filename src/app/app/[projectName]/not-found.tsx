import { Container, Stack, Title, Text, Button, Box } from '@mantine/core';
import { IconHome, IconArrowLeft } from '@tabler/icons-react';
import Link from 'next/link';

export default function ProjectNotFound() {
  return (
    <Container size="sm" py={80}>
      <Stack align="center" gap={32}>
        <Box ta="center">
          <Title order={1} size={48} fw={700} c="gray.8">
            404
          </Title>
          <Title order={2} size={24} fw={600} mt={16}>
            Project Not Found
          </Title>
          <Text size="lg" c="gray.6" mt={16} maw={400} mx="auto">
            The project you&apos;re looking for doesn&apos;t exist or may have been removed.
          </Text>
        </Box>

        <Stack gap={16} align="center">
          <Button
            component={Link}
            href="/app"
            size="md"
            leftSection={<IconHome size={16} />}
            style={{
              backgroundColor: '#FFDD44',
              color: '#000',
              fontWeight: 600,
              border: 'none',
            }}
          >
            Go to Dashboard
          </Button>
          
          <Button
            variant="subtle"
            size="md"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}