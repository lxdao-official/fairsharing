'use client';
import React, { useEffect, useState } from 'react';
import { ConnectKitButton } from 'connectkit';
import { Button, Avatar, Group } from '@mantine/core';
import { useAccount, useSignMessage } from 'wagmi';
import { useRouter } from 'next/navigation';
import { trpc } from '@/utils/trpc';
import { useAuth } from '@/hooks/useAuth';

export function ConnectWallet() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { session, isAuthenticated, setSession } = useAuth();
  const { signMessageAsync } = useSignMessage();
  const [isSigningAttempted, setIsSigningAttempted] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // tRPC hooks
  const utils = trpc.useUtils();
  const authenticateMutation = trpc.user.authenticate.useMutation();

  // Handle automatic authentication attempt when wallet connects
  useEffect(() => {
    const handleAutoAuthentication = async () => {
      if (!address) return;

      setIsSigningAttempted(true);
      try {
        await performAuthentication(address);
      } catch {
        console.log('Auto authentication failed, user can try manual sign');
      }
    };

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
      const nonceResult = await utils.user.getNonce.fetch({
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

  // Uncomment if needed for logout functionality
  // const handleDisconnect = () => {
  //   clearSession();
  //   setIsSigningAttempted(false);
  // };

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

          // Connected and authenticated (show ConnectKit button + custom avatar)
          return (
            <Group gap="sm">
              <ConnectKitButton showBalance={false} showAvatar={false} />
              <Avatar
                src={session?.user.avatar}
                alt={session?.user.name || ensName || 'User Avatar'}
                size="md"
                radius="xl"
                style={{ cursor: 'pointer' }}
                onClick={() => router.push(`/app/user/${address}`)}
              >
                {!session?.user.avatar &&
                  (ensName
                    ? ensName.slice(0, 2)
                    : address?.slice(2, 4) || 'U'
                  ).toUpperCase()}
              </Avatar>
            </Group>
          );
        }}
      </ConnectKitButton.Custom>
    </div>
  );
}
