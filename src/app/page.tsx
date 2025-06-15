'use client';

import { AppShell, Burger, Group, Title, Text, Button } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

export default function Home() {
  const [opened, { toggle }] = useDisclosure();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <Title order={3}>FairSharing</Title>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Text>Navigation content</Text>
      </AppShell.Navbar>

      <AppShell.Main>
        <Text>Main content</Text>
        <Button mt="md">Click me</Button>
      </AppShell.Main>
    </AppShell>
  );
}
