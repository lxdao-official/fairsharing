import { Box, Stack, Text, Title, Button, Center } from '@mantine/core';
import Image from 'next/image';
import Link from 'next/link';

export function EcosystemSection() {
  return (
    <Box
      mt={112}
      mb={40}
      style={{
        borderRadius: 36,
        border: '1px solid #000000',
        backgroundColor: '#ffffff',
      }}
    >
      <Center>
        <Stack
          align="center"
          gap={32}
          style={{ maxWidth: '900px', textAlign: 'center' }}
        >
          <Title
            order={2}
            mt={80}
            style={{
              fontSize: 40,
            }}
          >
            Help Grow the Fairsharing Ecosystem
          </Title>
          <Text
            style={{
              fontSize: 20,
              lineHeight: 1.4,
            }}
          >
            Your decentralized hub development, innovation, and community
            onboarding.
            <br />
            Support a future where contributions are valued — fairly.
          </Text>

          <Link href="https://t.me/brucexu_eth" target="_blank">
            <Button size="lg" radius="md">
              contact for donation
            </Button>
          </Link>

          <Box mt={40}>
            <Image
              src="/homepage/image5.jpg"
              alt="FairSharing ecosystem illustration"
              width={680}
              height={400}
              style={{
                maxWidth: '100%',
                height: 'auto',
                display: 'block',
              }}
            />
          </Box>
        </Stack>
      </Center>
    </Box>
  );
}
