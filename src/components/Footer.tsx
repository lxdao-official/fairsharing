import { Container, Group, Stack, Text, Anchor, Title } from '@mantine/core';

export function Footer() {
  return (
    <footer
      style={{ background: '#23231d', color: 'white', padding: '2rem 0' }}
    >
      <Container size="xl" style={{ maxWidth: 1280 }}>
        <Group align="flex-start">
          <Stack style={{ width: 200, marginRight: 56 }}>
            <Title order={3} style={{ color: 'white', fontSize: '1.5rem' }}>
              Developer
            </Title>
            <Anchor
              href="https://github.com/lxdao-official/fairsharing"
              target="_blank"
              underline="never"
              style={{ color: 'white' }}
            >
              GitHub
            </Anchor>
          </Stack>
          <Stack style={{ width: 200, marginRight: 56 }}>
            <Title order={3} style={{ color: 'white', fontSize: '1.5rem' }}>
              Follow us
            </Title>
            <Anchor
              href="https://x.com/fairshar_ing"
              target="_blank"
              underline="never"
              style={{ color: 'white' }}
            >
              Twitter
            </Anchor>
            <Anchor
              href="https://t.me/LXDAO/32"
              target="_blank"
              underline="never"
              style={{ color: 'white' }}
            >
              Telegram
            </Anchor>
          </Stack>
          <Stack style={{ width: 200 }}>
            <Title order={3} style={{ color: 'white', fontSize: '1.5rem' }}>
              Resources
            </Title>
            <Anchor
              href="https://docs.fairshar.ing"
              target="_blank"
              underline="never"
              style={{ color: 'white' }}
            >
              Docs
            </Anchor>
          </Stack>
        </Group>
      </Container>
    </footer>
  );
}
