'use client';

import { AppShell, Text, Button } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Header } from '../components/Header';

export default function Home() {
  const [opened, { toggle }] = useDisclosure();

  return (
    <AppShell header={{ height: 64 }} padding="md">
      <AppShell.Header>
        <Header />
      </AppShell.Header>

      <AppShell.Main>
        <Text>Main content</Text>
        <Button mt="md">Click me</Button>
      </AppShell.Main>
    </AppShell>
  );
}
