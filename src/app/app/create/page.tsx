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
import { IconUser, IconCircleCheckFilled, IconLock } from '@tabler/icons-react';

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
            <Stack style={{ flex: 1, maxWidth: 785 }}>
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

              {/* Validation Period */}
              <Box>
                <Text style={{ fontWeight: 700, fontSize: 16 }}>
                  Validation Period
                  <span style={{ color: '#F43F5E', marginLeft: 4 }}>*</span>
                </Text>
                <Group align="center" mt={8} mb={8}>
                  <TextInput
                    placeholder="5"
                    style={{ width: 100 }}
                    radius="sm"
                    size="sm"
                  />
                  <Text fw={800} style={{ color: '#6B7280' }}>
                    Days
                  </Text>
                </Group>
              </Box>

              {/* Who can submit contributions? */}
              <Box>
                <Text style={{ fontWeight: 700, fontSize: 16 }} mb={8}>
                  Who can submit contributions?
                  <span style={{ color: '#F43F5E', marginLeft: 4 }}>*</span>
                </Text>
                <SubmitterCardSelect />
              </Box>

              {/* Default Hourly Pay */}
              <Box>
                <Text style={{ fontWeight: 700, fontSize: 16 }}>
                  Default Hourly Pay
                </Text>
                <Text
                  style={{ color: '#6B7280', fontSize: 14, marginBottom: 8 }}
                >
                  Used to calculate contribution value as 'hours worked × hourly
                  rate'. You can later set custom rates for each contributor. If
                  left blank or set to 0, contributors can claim tokens freely.
                </Text>
                <Group align="center" mt={8}>
                  <TextInput
                    placeholder="0"
                    style={{ width: 120 }}
                    radius="sm"
                    size="sm"
                  />
                  <Text style={{ color: '#6B7280', fontWeight: 800 }}>
                    TOKEN_NAME/hour
                  </Text>
                </Group>
              </Box>
            </Stack>
          </Group>
          {/* Team Member Section */}
          <Group align="flex-start" gap={48} mt={56}>
            <Box style={{ minWidth: 260 }}>
              <Title order={2}>Team Member</Title>
              <Text c="#6B7280" style={{ fontSize: 14 }}>
                This part is optional.
                <br />
                You can edit it later in the project page.
              </Text>
            </Box>
            <Box style={{ flex: 1, maxWidth: 785 }}>
              <TextInput
                label={
                  <span style={{ fontWeight: 700, fontSize: 16 }}>
                    Project Owner (Wallet address or ENS)
                  </span>
                }
                description={
                  <span style={{ color: '#6B7280', fontSize: 14 }}>
                    Defaults to the project creator.
                  </span>
                }
                placeholder="0x123456"
                radius="sm"
                size="md"
              />
            </Box>
          </Group>
        </Container>
      </AppShell.Main>

      <AppShell.Footer style={{ position: 'static' }}>
        <Footer />
      </AppShell.Footer>
    </AppShell>
  );
}

// 通用卡片选择组件
function CardSelect<T extends string>({
  options,
  value,
  onChange,
}: {
  options: {
    key: T;
    icon: React.ReactNode;
    title: string;
    description: string;
  }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <Group gap={8}>
      {options.map((opt) => (
        <CardOption
          key={opt.key}
          icon={opt.icon}
          title={opt.title}
          description={opt.description}
          active={value === opt.key}
          onClick={() => onChange(opt.key)}
        />
      ))}
    </Group>
  );
}

function CardOption({
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

// 替换 Who can validate contributions? 选择器
function ValidateCardSelect() {
  const [value, setValue] = useState<'specific' | 'all'>('specific');
  const options: {
    key: 'specific' | 'all';
    icon: React.ReactNode;
    title: string;
    description: string;
  }[] = [
    {
      key: 'specific',
      icon: <IconUser size={32} />,
      title: 'Specific Members',
      description: "Only members added as 'validator'",
    },
    {
      key: 'all',
      icon: <IconUser size={32} />,
      title: 'Every Contributor',
      description: 'Anyone contributed to this project',
    },
  ];
  return (
    <CardSelect
      options={options}
      value={value}
      onChange={setValue as (v: 'specific' | 'all') => void}
    />
  );
}

function SubmitterCardSelect() {
  const [value, setValue] = useState<'everyone' | 'restricted'>('everyone');
  const options: {
    key: 'everyone' | 'restricted';
    icon: React.ReactNode;
    title: string;
    description: string;
  }[] = [
    {
      key: 'everyone',
      icon: <IconLock size={28} />,
      title: 'Everyone',
      description: 'All people using FairSharing',
    },
    {
      key: 'restricted',
      icon: <IconLock size={28} />,
      title: 'Restricted',
      description: 'Only members invited to this project',
    },
  ];
  return (
    <CardSelect
      options={options}
      value={value}
      onChange={setValue as (v: 'everyone' | 'restricted') => void}
    />
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
