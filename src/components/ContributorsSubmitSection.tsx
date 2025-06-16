import { Box, Grid, Stack, Text, Title } from '@mantine/core';
import Image from 'next/image';

export function ContributorsSubmitSection() {
  return (
    <Box mt={112}>
      <Grid align="center" gutter={{ base: 40, md: 60 }}>
        <Grid.Col span={{ base: 12, md: 6 }} order={{ base: 2, md: 1 }}>
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
              src="/homepage/image2.jpg"
              alt="Contributors submit work interface"
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
        <Grid.Col span={{ base: 12, md: 6 }} order={{ base: 1, md: 2 }}>
          <Stack gap={24}>
            <Title
              order={2}
              style={{
                fontSize: 40,
                fontWeight: 700,
                lineHeight: 1.2,
              }}
            >
              Contributors submit work
              <br />
              as transparent logs
            </Title>
            <Box
              style={{ display: 'flex', alignItems: 'center', marginTop: 40 }}
            >
              <Image
                src="/homepage/step1-icon.png"
                alt="Step 1"
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
                Contribution Record
              </Text>
            </Box>
          </Stack>
        </Grid.Col>
      </Grid>
    </Box>
  );
}
