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
  Radio,
} from '@mantine/core';
import { useState } from 'react';
import { IconUser, IconCircleCheckFilled } from '@tabler/icons-react';

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

              <Box>
                <Text style={{ fontWeight: 700, fontSize: 16 }}>
                  Validation Approval Strategy
                  <span style={{ color: '#F43F5E', marginLeft: 4 }}>*</span>
                </Text>
                <Text
                  style={{ color: '#6B7280', fontSize: 14, marginBottom: 8 }}
                >
                  If you need furthur customization, please contact the
                  Fairsharing team.
                </Text>
                <ValidationStrategySelect />
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

function ValidationStrategySelect() {
  const [value, setValue] = useState('simple');
  const options = [
    {
      key: 'simple',
      label: 'Simple Majority',
      desc: 'If ore than 50% of the votes go to "Approve"',
    },
    {
      key: 'quorum',
      label: 'Quorum + Majority',
      desc: 'If the total number of votes reaches a preset quorum (e.g. 100 tokens or 20 voters) AND the majority votes for "Approve".',
    },
    {
      key: 'absolute',
      label: 'Absolute Threshold',
      desc: 'If the "Approve" votes reach a fixed number or percentage, regardless of total turnout. E.g.: 1,000 votes for "Approve" minimum, or at least 60% Yes votes.',
    },
    {
      key: 'relative',
      label: 'Relative Majority',
      desc: "Whichever option has the most votes wins — even if it's less than 50%.",
    },
  ];
  return (
    <Radio.Group value={value} onChange={setValue}>
      {options.map((opt) => (
        <Radio
          key={opt.key}
          value={opt.key}
          label={
            <span>
              <span style={{ fontWeight: 700, fontSize: 16 }}>
                {opt.label}:
              </span>
              <span style={{ color: '#222', fontSize: 16, marginLeft: 4 }}>
                {opt.desc}
              </span>
            </span>
          }
          mb={8}
          color="secondary"
        />
      ))}
    </Radio.Group>
  );
}
