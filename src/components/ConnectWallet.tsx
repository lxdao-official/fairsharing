'use client';
import React, { useEffect, useState } from 'react';
import { ConnectKitButton } from 'connectkit';
import { Button } from '@mantine/core';
import { useAccount, useSignMessage } from 'wagmi';
import { trpc } from '@/utils/trpc';
import { useAuth } from '@/hooks/useAuth';

export function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { session, isAuthenticated, setSession, clearSession } = useAuth();
  const { signMessageAsync } = useSignMessage();
  const [isSigningAttempted, setIsSigningAttempted] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // tRPC mutations
  const getNonceMutation = trpc.user.getNonce.useMutation();
  const authenticateMutation = trpc.user.authenticate.useMutation();

  // Handle automatic authentication attempt when wallet connects
  useEffect(() => {
    if (isConnected && address && !isAuthenticated && !isSigningAttempted) {
      handleAutoAuthentication();
    }
  }, [isConnected, address, isAuthenticated, isSigningAttempted]);

  // Reset signing attempt when wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      setIsSigningAttempted(false);
    }
  }, [isConnected]);

  const handleAutoAuthentication = async () => {
    if (!address) return;

    setIsSigningAttempted(true);
    try {
      await performAuthentication(address);
    } catch (error) {
      console.log('Auto authentication failed, user can try manual sign');
    }
  };

  const handleManualSign = async () => {
    if (!address) return;

    try {
      await performAuthentication(address);
    } catch (error) {
      console.error('Manual authentication failed:', error);
    }
  };

  const performAuthentication = async (walletAddress: string) => {
    setIsAuthenticating(true);

    try {
      // Get nonce
      const nonceResult = await getNonceMutation.mutateAsync({
        walletAddress,
      });

      // Sign message
      const signature = await signMessageAsync({
        message: nonceResult.message,
      });

      // Authenticate
      const authResult = await authenticateMutation.mutateAsync({
        walletAddress,
        signature,
        message: nonceResult.message,
      });

      if (authResult.success) {
        setSession(authResult.session);
      }
    } catch (error) {
      throw error;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleDisconnect = () => {
    clearSession();
    setIsSigningAttempted(false);
  };

  return (
    <div>
      <ConnectKitButton.Custom>
        {({ isConnected, isConnecting, show, address, ensName }) => {
          // Not connected state
          if (!isConnected) {
            return (
              <Button
                onClick={show}
                loading={isConnecting}
                variant="filled"
                size="md"
              >
                Connect Wallet
              </Button>
            );
          }

          // Connected but not authenticated and auto-sign failed
          if (
            isConnected &&
            !isAuthenticated &&
            isSigningAttempted &&
            !isAuthenticating
          ) {
            return (
              <Button onClick={handleManualSign} variant="filled" size="md">
                Sign to Authenticate
              </Button>
            );
          }

          // Connected and authenticating
          if (isConnected && isAuthenticating) {
            return (
              <Button loading={true} variant="filled" size="md">
                Signing...
              </Button>
            );
          }

          // Connected and authenticated (use default ConnectKit button)
          return <ConnectKitButton showBalance={false} showAvatar={true} />;
        }}
      </ConnectKitButton.Custom>
    </div>
  );
}
