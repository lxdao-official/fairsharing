'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink, loggerLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import { useState } from 'react';
import superjson from 'superjson';
import { createConfig, WagmiProvider } from 'wagmi';
import { defineChain } from 'viem';
import { ConnectKitProvider, getDefaultConfig } from 'connectkit';

import type { AppRouter } from '@/server/routers';
import { useAuth } from '@/hooks/useAuth';

// Create tRPC client
const trpc = createTRPCReact<AppRouter>();

// Wagmi config with ConnectKit
const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 31337);
const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL ?? 'http://127.0.0.1:8545';

// Single env-driven chain (works for local, Sepolia, OP Sepolia, mainnet, etc.)
const envChain = defineChain({
  id: chainId,
  name:
    chainId === 1
      ? 'Ethereum'
      : chainId === 11155111
        ? 'Sepolia'
        : chainId === 10
          ? 'Optimism'
          : chainId === 11155420
            ? 'Optimism Sepolia'
            : 'Custom Chain',
  network:
    chainId === 1
      ? 'mainnet'
      : chainId === 11155111
        ? 'sepolia'
        : chainId === 10
          ? 'optimism'
          : chainId === 11155420
            ? 'optimism-sepolia'
            : 'custom',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [rpcUrl],
    },
  },
});

const chains = [envChain];

const config = createConfig(
  getDefaultConfig({
    appName: 'FairSharing',
    walletConnectProjectId:
      process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
    chains,
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
          transformer: superjson,
          headers: () => {
            // This function is called on every request
            if (typeof window !== 'undefined') {
              try {
                const session = localStorage.getItem('fairsharing_session');
                if (session) {
                  const parsed = JSON.parse(session);
                  if (parsed.token && parsed.expiresAt > Date.now()) {
                    if (process.env.NODE_ENV === 'development') {
                      console.log('🔑 Getting auth token for request');
                    }
                    return {
                      authorization: `Bearer ${parsed.token}`,
                    };
                  } else {
                    if (process.env.NODE_ENV === 'development') {
                      console.log('⚠️ Token expired, removing from localStorage');
                    }
                    localStorage.removeItem('fairsharing_session');
                  }
                }
              } catch (error) {
                if (process.env.NODE_ENV === 'development') {
                  console.error('❌ Failed to get auth token:', error);
                }
                localStorage.removeItem('fairsharing_session');
              }
            }
            if (process.env.NODE_ENV === 'development') {
              console.log('🚫 No valid token found');
            }
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
