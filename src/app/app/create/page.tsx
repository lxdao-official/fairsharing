'use client';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import {
  Container,
  Title,
  Group,
  Text,
  TextInput,
  Stack,
  AppShell,
} from '@mantine/core';

export default function CreateProjectPage() {
  return (
    <AppShell header={{ height: 64 }} padding="md">
      <AppShell.Header>
        <Header />
      </AppShell.Header>

      <AppShell.Main>
        <Container size="xl" style={{ maxWidth: 1280 }}>
          <Title
            order={1}
            mt={56}
            mb={56}
            style={{
              fontSize: 48,
            }}
          >
            Create My Pie
          </Title>
          <Group align="flex-start" gap={48}>
            <Title order={2}>Project Information</Title>
            <Stack style={{ flex: 1 }}>
              <Text
                fw={700}
                style={{
                  fontFamily:
                    'var(--font-lexend), Arial, Helvetica, sans-serif',
                }}
              >
                Project Name <span style={{ color: '#F43F5E' }}>*</span>
              </Text>
              <TextInput
                placeholder=""
                radius="sm"
                styles={{
                  input: {
                    fontSize: 18,
                    padding: '20px 16px',
                    background: '#fff',
                    borderColor: '#DEE2E6',
                  },
                }}
              />
            </Stack>
          </Group>
        </Container>
      </AppShell.Main>

      <AppShell.Footer style={{ position: 'static' }}>
        <Footer />
      </AppShell.Footer>
    </AppShell>
  );
}
