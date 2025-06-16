'use client';

import { Group, Button, UnstyledButton } from '@mantine/core';
import Image from 'next/image';
import Link from 'next/link';
import { ConnectWallet } from './ConnectWallet';

function Logo() {
  return <Image src="/logo.png" alt="Logo" width={158} height={40} />;
}

function TwitterIcon() {
  return (
    <Image src="/icons/twitter.png" alt="Twitter" width={40} height={40} />
  );
}

function TelegramIcon() {
  return (
    <Image src="/icons/telegram.png" alt="Telegram" width={40} height={40} />
  );
}

export function Header() {
  return (
    <Group justify="space-between" align="center" h="100%" px="md">
      <Group>
        <Link href="/">
          <Logo />
        </Link>
      </Group>
      <Group gap="md">
        <UnstyledButton aria-label="Twitter">
          <Link
            style={{ display: 'flex', alignItems: 'center' }}
            target="_blank"
            href="https://x.com/fairshar_ing"
          >
            <TwitterIcon />
          </Link>
        </UnstyledButton>
        <UnstyledButton aria-label="Telegram">
          <Link
            style={{ display: 'flex', alignItems: 'center' }}
            target="_blank"
            href="https://t.me/LXDAO/32"
          >
            <TelegramIcon />
          </Link>
        </UnstyledButton>
        <Link href="/app/create" style={{ textDecoration: 'none' }}>
          <Button radius="md" size="md" color="primary">
            Create New Pie
          </Button>
        </Link>
        <ConnectWallet />
      </Group>
    </Group>
  );
}
