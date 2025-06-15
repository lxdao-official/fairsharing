'use client';

import { AppShell, Button, Container, Title } from '@mantine/core';
import { Header } from '../components/Header';
import { Footer } from '@/components/Footer';

export default function Home() {
  return (
    <AppShell header={{ height: 64 }} padding="md">
      <AppShell.Header>
        <Header />
      </AppShell.Header>

      <AppShell.Main>
        <Container size="xl" style={{ maxWidth: 1280 }}>
          <Title order={1}>Main content</Title>
          <Button color="secondary" mt="md">
            Click me
          </Button>
        </Container>
      </AppShell.Main>
      <AppShell.Footer>
        <Footer />
      </AppShell.Footer>
    </AppShell>
  );
}
