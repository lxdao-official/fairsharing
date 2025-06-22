'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink, loggerLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import { useState } from 'react';
import { createConfig, WagmiProvider } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { ConnectKitProvider, getDefaultConfig } from 'connectkit';

import type { AppRouter } from '@/server/routers';
import { useAuth } from '@/hooks/useAuth';

// Create tRPC client
const trpc = createTRPCReact<AppRouter>();

// Wagmi config with ConnectKit
const config = createConfig(
  getDefaultConfig({
    appName: 'FairSharing',
    walletConnectProjectId:
      process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
    chains: [mainnet, sepolia],
    ssr: true,
  }),
);

// Inner component that uses wagmi hooks
function ConnectKitInner({ children }: { children: React.ReactNode }) {
  const { clearSession } = useAuth();

  const handleDisconnect = () => {
    clearSession();
  };

  return (
    <ConnectKitProvider theme="auto" onDisconnect={handleDisconnect}>
      {children}
    </ConnectKitProvider>
  );
}

function TRPCInner({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === 'development' ||
            (opts.direction === 'down' && opts.result instanceof Error),
        }),
        httpBatchLink({
          url: '/api/trpc',
          headers: () => {
            // This function is called on every request
            if (typeof window !== 'undefined') {
              try {
                const session = localStorage.getItem('fairsharing_session');
                if (session) {
                  const parsed = JSON.parse(session);
                  if (parsed.token && parsed.expiresAt > Date.now()) {
                    console.log('🔑 Getting auth token for request');
                    return {
                      authorization: `Bearer ${parsed.token}`,
                    };
                  } else {
                    console.log('⚠️ Token expired, removing from localStorage');
                    localStorage.removeItem('fairsharing_session');
                  }
                }
              } catch (error) {
                console.error('❌ Failed to get auth token:', error);
                localStorage.removeItem('fairsharing_session');
              }
            }
            console.log('🚫 No valid token found');
            return {};
          },
        }),
      ],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          <ConnectKitInner>{children}</ConnectKitInner>
        </WagmiProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

export default function TRPCProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TRPCInner>{children}</TRPCInner>;
}
