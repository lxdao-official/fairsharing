import { Box, Grid, Stack, Text, Title } from '@mantine/core';
import Image from 'next/image';

export function PeersValidateSection() {
  return (
    <Box mt={112}>
      <Grid align="center" gutter={{ base: 40, md: 60 }}>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Stack gap={24}>
            <Title
              order={2}
              style={{
                fontSize: 40,
                fontWeight: 700,
                lineHeight: 1.2,
              }}
            >
              Peers vote to validate
              <br />
              contributions and get
              <br />
              validated ones on-chain
            </Title>

            <Box
              style={{ display: 'flex', alignItems: 'center', marginTop: 40 }}
            >
              <Image
                src="/homepage/step2-icon.png"
                alt="Step 2"
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
                Contribution Validation
              </Text>
            </Box>
          </Stack>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Box
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: '32px',
              overflow: 'hidden',
            }}
          >
            <Image
              src="/homepage/image3.jpg"
              alt="Peers validation interface"
              width={640}
              height={670}
              style={{
                maxWidth: '100%',
                height: 'auto',
                borderRadius: '16px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
              }}
            />
          </Box>
        </Grid.Col>
      </Grid>
    </Box>
  );
}
