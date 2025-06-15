import { Box, Grid, Stack, Text, Title, Badge } from '@mantine/core';
import Image from 'next/image';

export function RewardsDistributionSection() {
  return (
    <Box mt={112}>
      <Grid align="center" gutter={{ base: 40, md: 60 }}>
        <Grid.Col span={{ base: 12, md: 6 }} order={{ base: 2, md: 1 }}>
          <Box
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Image
              src="/homepage/image4.jpg"
              alt="Rewards distribution interface"
              width={640}
              height={670}
              style={{
                maxWidth: '100%',
                height: 'auto',
                borderRadius: '36px',
                overflow: 'hidden',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
              }}
            />
          </Box>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }} order={{ base: 1, md: 2 }}>
          <Stack gap={24}>
            <Title
              order={2}
              style={{
                fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
                fontWeight: 700,
                lineHeight: 1.3,
                color: '#1F2937',
              }}
            >
              Rewards are automatically
              <br />
              distributed based on consensus
            </Title>

            <Box
              style={{ display: 'flex', alignItems: 'center', marginTop: 40 }}
            >
              <Image
                src="/homepage/step3-icon.png"
                alt="Step 3"
                width={40}
                height={40}
                style={{ marginBottom: '16px' }}
              />
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                }}
              >
                Reward Distribution
              </Text>
            </Box>
          </Stack>
        </Grid.Col>
      </Grid>
    </Box>
  );
}
