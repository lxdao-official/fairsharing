'use client';

import { AppShell, Container } from '@mantine/core';
import { Header } from '../../components/Header';
import { Footer } from '@/components/Footer';

export default function AppPage() {
  return (
    <AppShell header={{ height: 64 }} padding="md">
      <AppShell.Header>
        <Header />
      </AppShell.Header>

      <AppShell.Main>
        <Container size="xl" style={{ maxWidth: 1280 }}>
          <h1>App Page</h1>
        </Container>
      </AppShell.Main>
      <AppShell.Footer>
        <Footer />
      </AppShell.Footer>
    </AppShell>
  );
}
