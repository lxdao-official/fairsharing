import { Box, Button, Center, Stack, Text, Title } from '@mantine/core';
import Image from 'next/image';
import Link from 'next/link';

export function HeroSection() {
  return (
    <Box mt={100}>
      <Center mb={40}>
        <Image
          src="/homepage/logoAnimation.gif"
          alt="FairSharing Logo Animation"
          width={160}
          height={160}
          priority
        />
      </Center>
      <Stack align="center" gap={24}>
        <Title
          order={1}
          style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            textAlign: 'center',
            fontWeight: 700,
            lineHeight: 1.2,
            maxWidth: '800px',
          }}
        >
          Grow the Pie Together
          <br />
          Share the Reward Fairly
        </Title>
        <Text
          size="xl"
          style={{
            textAlign: 'center',
            maxWidth: '600px',
            fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',

            lineHeight: 1.6,
          }}
        >
          A decentralized way to record, validate, and reward contributions.
        </Text>
        <Link href="/app" style={{ textDecoration: 'none' }}>
          <Button size="lg" radius="md" mt={24} color="secondary">
            Launch the App
          </Button>
        </Link>
      </Stack>
    </Box>
  );
}
