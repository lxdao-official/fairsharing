'use client';

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

// Dynamically import TRPCProvider to avoid SSR issues
const TRPCProvider = dynamic(() => import('./TRPCProvider'), {
  ssr: false,
  loading: () => <div>Loading...</div>,
});

interface ClientWrapperProps {
  children: ReactNode;
}

export default function ClientWrapper({ children }: ClientWrapperProps) {
  return <TRPCProvider>{children}</TRPCProvider>;
}
