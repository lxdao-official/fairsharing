import { Box, Button, Center, Stack, Text, Title } from '@mantine/core';
import Image from 'next/image';
import Link from 'next/link';

export function HeroSection() {
  return (
    <Box>
      <Center>
        <Image src="/logo.png" alt="Logo" width={80} height={80} />
      </Center>
      <Stack align="center" mt={32} gap={24}>
        <Title
          order={1}
          style={{
            fontSize: 64,
            textAlign: 'center',
          }}
        >
          Grow the Pie Together
          <br />
          Share the Reward Fairly
        </Title>
        <Text size="xl" style={{ textAlign: 'center', maxWidth: 700 }}>
          A decentralized way to record, validate, and reward contributions.
        </Text>
        <Link href="/app" style={{ textDecoration: 'none' }}>
          <Button size="lg" radius="md" color="secondary">
            Launch the App
          </Button>
        </Link>
      </Stack>
    </Box>
  );
}
