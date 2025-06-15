import { Box } from '@mantine/core';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
}

export function Layout({ children, sidebar }: LayoutProps) {
  return (
    <Box
      style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
    >
      {/* Header */}
      <Box style={{ height: 64, borderBottom: '1px solid #E5E7EB' }}>
        <Header />
      </Box>

      {/* Main Content Area */}
      <Box style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        {sidebar && sidebar}

        {/* Main Content */}
        <Box
          style={{
            flex: 1,
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          {children}
        </Box>
      </Box>

      {/* Footer */}
      <Footer />
    </Box>
  );
}
