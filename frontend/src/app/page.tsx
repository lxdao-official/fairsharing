'use client';

import { AppShell, Container } from '@mantine/core';
import { Header } from '../components/Header';
import { Footer } from '@/components/Footer';
import { HeroSection } from '@/components/HeroSection';
import { WorkDeservesSection } from '@/components/WorkDeservesSection';
import { ContributorsSubmitSection } from '@/components/ContributorsSubmitSection';
import { PeersValidateSection } from '@/components/PeersValidateSection';
import { RewardsDistributionSection } from '@/components/RewardsDistributionSection';
import { EcosystemSection } from '@/components/EcosystemSection';

export default function Home() {
  return (
    <AppShell header={{ height: 64 }} padding="md">
      <AppShell.Header>
        <Header />
      </AppShell.Header>

      <AppShell.Main style={{ backgroundColor: '#F9F9F9' }}>
        <Container size="xl" style={{ maxWidth: 1280 }}>
          <HeroSection />
          <WorkDeservesSection />
          <ContributorsSubmitSection />
          <PeersValidateSection />
          <RewardsDistributionSection />
          <EcosystemSection />
        </Container>
      </AppShell.Main>

      <AppShell.Footer style={{ position: 'static' }}>
        <Footer />
      </AppShell.Footer>
    </AppShell>
  );
}
