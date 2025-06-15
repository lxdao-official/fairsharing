'use client';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import {
  Container,
  Title,
  Group,
  Text,
  TextInput,
  Stack,
  AppShell,
  Textarea,
  Box,
} from '@mantine/core';
import { useState } from 'react';
import { IconUser } from '@tabler/icons-react';

export default function CreateProjectPage() {
  return (
    <AppShell header={{ height: 64 }} padding="md">
      <AppShell.Header>
        <Header />
      </AppShell.Header>

      <AppShell.Main>
        <Container size="xl" style={{ maxWidth: 1280 }}>
          <Title
            order={1}
            mt={56}
            mb={56}
            style={{
              fontSize: 48,
            }}
          >
            Create My Pie
          </Title>
          <Group align="flex-start" gap={48}>
            <Title order={2}>Project Information</Title>
            <Stack style={{ flex: 1 }}>
              <TextInput
                label={
                  <span style={{ fontWeight: 700, fontSize: 16 }}>
                    Project Name
                  </span>
                }
                required
                placeholder=""
                radius="sm"
              />

              <Textarea
                label={
                  <span style={{ fontWeight: 700, fontSize: 16 }}>
                    Description
                  </span>
                }
                required
                description={
                  <span style={{ color: '#6B7280', fontSize: 16 }}>
                    No more than 140 words
                  </span>
                }
                minRows={5}
                maxRows={8}
                radius="sm"
              />

              <TextInput
                label={
                  <span style={{ fontWeight: 700, fontSize: 16 }}>
                    Token Name
                  </span>
                }
                required
                description={
                  <span style={{ color: '#6B7280', fontSize: 16 }}>
                    Token representing contributions in your project (doesn't
                    have to be an on-chain token)
                  </span>
                }
                placeholder="TOKEN_NAME"
                radius="sm"
                styles={{
                  input: {
                    width: '160px',
                  },
                }}
              />

              {/* Who can validate contributions? */}
              <Box>
                <Text style={{ fontWeight: 700, fontSize: 16 }}>
                  Who can validate contributions?
                  <span style={{ color: '#F43F5E', marginLeft: 4 }}>*</span>
                </Text>
                <Text
                  style={{
                    color: '#6B7280',
                    fontSize: 14,
                    marginBottom: 8,
                  }}
                >
                  In FairSharing, contributions must be validated before they're
                  recorded on-chain. Select who will have the authority to
                  validate contributions for your project.
                </Text>
                <ValidateCardSelect />
              </Box>
            </Stack>
          </Group>
        </Container>
      </AppShell.Main>

      <AppShell.Footer style={{ position: 'static' }}>
        <Footer />
      </AppShell.Footer>
    </AppShell>
  );
}

function ValidateCardSelect() {
  const [value, setValue] = useState<'specific' | 'all'>('specific');
  return (
    <Box style={{ display: 'flex', gap: 8 }}>
      <ValidateCard
        icon={<IconUser size={32} />}
        title="Specific Members"
        description={"Only members added as 'validator'"}
        active={value === 'specific'}
        onClick={() => setValue('specific')}
      />
      <ValidateCard
        icon={<IconUser size={32} />}
        title="Every Contributor"
        description="Anyone contributed to this project"
        active={value === 'all'}
        onClick={() => setValue('all')}
      />
    </Box>
  );
}

function ValidateCard({
  icon,
  title,
  description,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Box
      onClick={onClick}
      style={{
        flex: 1,
        cursor: 'pointer',
        border: active ? '1px solid #FFDD44' : '1px solid #e5e7eb',
        background: active ? '#FEF6C7' : '#fff',
        borderRadius: 8,
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: 260,
        maxWidth: 320,
        transition: 'all 0.2s',
      }}
    >
      <Box style={{ marginRight: 12 }}>{icon}</Box>
      <Box style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Text style={{ fontWeight: 700, fontSize: 14 }}>{title}</Text>
        <Text style={{ color: '#6B7280', fontSize: 14 }}>{description}</Text>
      </Box>
    </Box>
  );
}
