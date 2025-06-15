'use client';
import { ConnectKitButton } from 'connectkit';
import { Button, Group, Text } from '@mantine/core';

export function ConnectWallet() {
  return (
    <ConnectKitButton.Custom>
      {({ isConnected, show, truncatedAddress, ensName }) => (
        <Button
          radius="md"
          size="md"
          color="primary"
          onClick={show}
          style={{ fontWeight: 500 }}
        >
          {isConnected ? (
            <Group gap={8}>
              <span
                style={{
                  display: 'inline-block',
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background:
                    'linear-gradient(135deg, #3b82f6 0%, #a78bfa 100%)',
                }}
              />
              <Text fw={700}>{ensName ?? truncatedAddress}</Text>
            </Group>
          ) : (
            <Text fw={700}>Connect Wallet</Text>
          )}
        </Button>
      )}
    </ConnectKitButton.Custom>
  );
}
