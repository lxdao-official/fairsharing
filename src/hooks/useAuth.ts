import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { AuthSession } from '@/lib/auth';

// localStorage keys
const STORAGE_KEYS = {
  SESSION: 'fairsharing_session',
} as const;

export interface UseAuthReturn {
  // State
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Utility methods
  clearSession: () => void;
  setSession: (session: AuthSession) => void;
}

export function useAuth(): UseAuthReturn {
  const [session, setSessionState] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { address, isConnected } = useAccount();

  // Initialize auth by checking localStorage session
  useEffect(() => {
    const initAuth = () => {
      try {
        const savedSession = localStorage.getItem(STORAGE_KEYS.SESSION);
        if (savedSession) {
          const parsed = JSON.parse(savedSession) as AuthSession;

          // Check if token is expired
          if (parsed.expiresAt > Date.now()) {
            setSessionState(parsed);
          } else {
            localStorage.removeItem(STORAGE_KEYS.SESSION);
          }
        }
      } catch (error) {
        console.error('Failed to parse saved session:', error);
        localStorage.removeItem(STORAGE_KEYS.SESSION);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Clear session when wallet disconnects or address changes
  useEffect(() => {
    if (
      session &&
      address && // Only check when we have an address
      isConnected && // Only check when connected
      session.user.walletAddress.toLowerCase() !== address.toLowerCase()
    ) {
      clearSession();
    }
  }, [isConnected, address, session]);

  const setSession = (newSession: AuthSession) => {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(newSession));
    setSessionState(newSession);
  };

  const clearSession = () => {
    setSessionState(null);
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  };

  return {
    session,
    isAuthenticated: !!session,
    isLoading,
    setSession,
    clearSession,
  };
}

// Simplified user info hook
export function useUser() {
  const { session, isAuthenticated, isLoading } = useAuth();

  return {
    user: session?.user || null,
    isAuthenticated,
    isLoading,
  };
}
