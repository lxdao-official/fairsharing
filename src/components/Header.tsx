'use client';

import { Group, Button, Text, rem, UnstyledButton } from '@mantine/core';
import Image from 'next/image';
import Link from 'next/link';

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
          <Link target="_blank" href="https://x.com/fairshar_ing">
            <TwitterIcon />
          </Link>
        </UnstyledButton>
        <UnstyledButton aria-label="Telegram">
          <Link target="_blank" href="https://t.me/LXDAO/32">
            <TelegramIcon />
          </Link>
        </UnstyledButton>
        <Button
          radius="md"
          size="md"
          color="#222"
          style={{ color: '#fff', background: '#222' }}
        >
          Launch the App
        </Button>
      </Group>
    </Group>
  );
}
