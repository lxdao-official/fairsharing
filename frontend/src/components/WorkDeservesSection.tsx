import { Box, Grid, Stack, Text, Title } from '@mantine/core';
import Image from 'next/image';

export function WorkDeservesSection() {
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
              Work Deserves to Be
              <br />
              Seen, Valued, and
              <br />
              Rewarded
            </Title>
            <Text
              style={{
                fontSize: 20,
                maxWidth: '480px',
                lineHeight: 1.4,
              }}
            >
              In DAOs and Web3 communities, valuable contributions often go
              unnoticed or unrewarded. FairSharing offers a transparent,
              peer-validated way to track work and distribute rewards.
            </Text>
            <Text
              style={{
                fontSize: 20,
                maxWidth: '480px',
                lineHeight: 1.4,
              }}
            >
              Let&apos;s stop the chaos of spreadsheets and start doing better.
            </Text>
          </Stack>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Box
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Image
              src="/homepage/image1.png"
              alt="Fair sharing pie chart illustration"
              width={640}
              height={670}
              style={{
                maxWidth: '100%',
                height: 'auto',
              }}
            />
          </Box>
        </Grid.Col>
      </Grid>
    </Box>
  );
}
