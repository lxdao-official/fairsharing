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
  Checkbox,
  Tooltip,
  Button,
} from '@mantine/core';
import { useState } from 'react';
import {
  IconUser,
  IconCircleCheckFilled,
  IconLock,
  IconPlus,
  IconInfoCircle,
  IconBrandX,
  IconBrandTelegram,
  IconWorld,
  IconCamera,
  IconBrandDiscord,
  IconMinus,
} from '@tabler/icons-react';

export default function CreateProjectPage() {
  return (
    <AppShell header={{ height: 64 }} padding="md">
      <AppShell.Header>
        <Header />
      </AppShell.Header>

      <AppShell.Main>
        <Container size="xl" pb={48} style={{ maxWidth: 1280 }}>
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

              {/* Member Management */}
              <Box mt={24}>
                <MemberManagement />
              </Box>
            </Box>
          </Group>

          {/* Other Links Section */}
          <Group align="flex-start" gap={48} mt={56}>
            <Box style={{ minWidth: 260 }}>
              <Title order={2}>Other Links</Title>
              <Text c="#6B7280" style={{ fontSize: 14 }}>
                This part is optional.
                <br />
                You can edit it later in the project page.
              </Text>
            </Box>
            <Box style={{ flex: 1, maxWidth: 785 }}>
              <OtherLinksManagement />
            </Box>
          </Group>

          <Group justify="flex-end" gap={48} mt={24}>
            <Box style={{ minWidth: 260 }}></Box>
            <Box style={{ flex: 1 }}>
              <Button size="md" radius="md" color="secondary">
                Create My Pie
              </Button>
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

interface Member {
  address: string;
  isValidator: boolean;
  isContributor: boolean;
  isAdmin: boolean;
}

function MemberManagement() {
  const [members, setMembers] = useState<Member[]>([
    {
      address: '',
      isValidator: false,
      isContributor: false,
      isAdmin: false,
    },
  ]);

  const addMember = () => {
    const newMember: Member = {
      address: '',
      isValidator: false,
      isContributor: false,
      isAdmin: false,
    };
    setMembers([...members, newMember]);
  };

  const updateMember = (address: string, field: keyof Member, value: any) => {
    setMembers(
      members.map((member) =>
        member.address === address ? { ...member, [field]: value } : member,
      ),
    );
  };

  const removeMember = (address: string) => {
    setMembers(members.filter((member) => member.address !== address));
  };

  return (
    <Box>
      <Group align="center" mb={16} display="flex">
        <Text style={{ fontWeight: 700, fontSize: 16, width: 320 }}>
          Member (Wallet address or ENS)
        </Text>
        <Group gap={48} ml="auto" style={{ paddingRight: 16 }}>
          <Group align="center" gap={8}>
            <Text style={{ fontWeight: 600, fontSize: 14 }}>Validator</Text>
            <Tooltip
              label="The person can vote to validate contributions."
              position="top"
              withArrow
              styles={{
                tooltip: {
                  backgroundColor: '#FEF6C7',
                  color: '#000',
                  border: '1px solid #FFDD44',
                  fontSize: 12,
                  padding: '8px 12px',
                },
              }}
            >
              <IconInfoCircle size={16} color="#6B7280" />
            </Tooltip>
          </Group>
          <Group align="center" gap={8}>
            <Text style={{ fontWeight: 600, fontSize: 14 }}>Contributor</Text>
            <Tooltip
              label="The person can submit contributions."
              position="top"
              withArrow
              styles={{
                tooltip: {
                  backgroundColor: '#FEF6C7',
                  color: '#000',
                  border: '1px solid #FFDD44',
                  fontSize: 12,
                  padding: '8px 12px',
                },
              }}
            >
              <IconInfoCircle size={16} color="#6B7280" />
            </Tooltip>
          </Group>
          <Group align="center" gap={8}>
            <Text style={{ fontWeight: 600, fontSize: 14 }}>Admin</Text>
            <Tooltip
              label="The person can manage project settings."
              position="top"
              withArrow
              styles={{
                tooltip: {
                  backgroundColor: '#FEF6C7',
                  color: '#000',
                  border: '1px solid #FFDD44',
                  fontSize: 12,
                  padding: '8px 12px',
                },
              }}
            >
              <IconInfoCircle size={16} color="#6B7280" />
            </Tooltip>
          </Group>
        </Group>
      </Group>

      {members.map((member) => (
        <Group
          key={member.address}
          align="center"
          mb={12}
          gap={16}
          display="flex"
        >
          <TextInput
            placeholder="0x123456"
            value={member.address}
            onChange={(e) =>
              updateMember(member.address, 'address', e.target.value)
            }
            style={{ width: 320 }}
            radius="sm"
            size="sm"
          />
          <Group gap={48} ml="auto" style={{ paddingRight: 16 }}>
            <Box
              style={{ display: 'flex', justifyContent: 'center', width: 80 }}
            >
              <Checkbox
                checked={member.isValidator}
                onChange={(e) =>
                  updateMember(member.address, 'isValidator', e.target.checked)
                }
                styles={{
                  input: {
                    width: 20,
                    height: 20,
                    '&:checked': {
                      backgroundColor: '#FFDD44',
                      borderColor: '#FFDD44',
                    },
                  },
                }}
              />
            </Box>
            <Box
              style={{ display: 'flex', justifyContent: 'center', width: 80 }}
            >
              <Checkbox
                checked={member.isContributor}
                onChange={(e) =>
                  updateMember(
                    member.address,
                    'isContributor',
                    e.target.checked,
                  )
                }
                styles={{
                  input: {
                    width: 20,
                    height: 20,
                    '&:checked': {
                      backgroundColor: '#FFDD44',
                      borderColor: '#FFDD44',
                    },
                  },
                }}
              />
            </Box>
            <Box
              style={{ display: 'flex', justifyContent: 'center', width: 80 }}
            >
              <Checkbox
                checked={member.isAdmin}
                onChange={(e) =>
                  updateMember(member.address, 'isAdmin', e.target.checked)
                }
                styles={{
                  input: {
                    width: 20,
                    height: 20,
                    '&:checked': {
                      backgroundColor: '#FFDD44',
                      borderColor: '#FFDD44',
                    },
                  },
                }}
              />
            </Box>
          </Group>
        </Group>
      ))}

      <Button
        rightSection={<IconPlus size={16} />}
        onClick={addMember}
        variant="filled"
        color="primary"
        radius="md"
        size="sm"
        mt={8}
      >
        Add
      </Button>
    </Box>
  );
}

interface LinkItem {
  id: string;
  type: 'x' | 'telegram' | 'website' | 'snapshot' | 'discord' | 'custom';
  label: string;
  placeholder: string;
  url: string;
}

function OtherLinksManagement() {
  const [links, setLinks] = useState<LinkItem[]>([]);

  const predefinedLinks = [
    {
      type: 'x' as const,
      label: 'X',
      placeholder: 'https://x.com/...',
      icon: <IconBrandX size={20} />,
    },
    {
      type: 'telegram' as const,
      label: 'Telegram',
      placeholder: 'https://t.me/...',
      icon: <IconBrandTelegram size={20} />,
    },
    {
      type: 'website' as const,
      label: 'Website',
      placeholder: 'https://...',
      icon: <IconWorld size={20} />,
    },
    {
      type: 'snapshot' as const,
      label: 'Snapshot',
      placeholder: 'https://snapshot.box/#/...',
      icon: <IconCamera size={20} />,
    },
    {
      type: 'discord' as const,
      label: 'Discord',
      placeholder: 'https://discord.gg/...',
      icon: <IconBrandDiscord size={20} />,
    },
    { type: 'custom' as const, label: 'Others', icon: <IconPlus size={16} /> },
  ];

  const addLink = (type: LinkItem['type']) => {
    const newLink: LinkItem = {
      id: Date.now().toString(),
      type,
      placeholder:
        type === 'custom'
          ? 'https://...'
          : predefinedLinks.find((p) => p.type === type)?.placeholder || '',
      label:
        type === 'custom'
          ? 'Custom Link'
          : predefinedLinks.find((p) => p.type === type)?.label || '',
      url: '',
    };
    setLinks([...links, newLink]);
  };

  const updateLink = (id: string, field: keyof LinkItem, value: string) => {
    setLinks(
      links.map((link) =>
        link.id === id ? { ...link, [field]: value } : link,
      ),
    );
  };

  const removeLink = (id: string) => {
    setLinks(links.filter((link) => link.id !== id));
  };

  const isLinkTypeAdded = (type: LinkItem['type']) => {
    return links.some((link) => link.type === type);
  };

  return (
    <Box>
      {/* Predefined Link Buttons */}
      <Group gap={12} mb={24}>
        {predefinedLinks.map((linkType) => (
          <Button
            key={linkType.type}
            rightSection={linkType.icon}
            onClick={() => addLink(linkType.type)}
            variant={isLinkTypeAdded(linkType.type) ? 'light' : 'filled'}
            color={isLinkTypeAdded(linkType.type) ? 'gray' : 'dark'}
            radius="md"
            size="sm"
            disabled={
              linkType.type !== 'custom' && isLinkTypeAdded(linkType.type)
            }
            styles={{
              root: {
                backgroundColor: isLinkTypeAdded(linkType.type)
                  ? '#F3F4F6'
                  : linkType.type === 'custom'
                  ? '#F9FAFB'
                  : '#2D2D2D',
                color: isLinkTypeAdded(linkType.type)
                  ? '#6B7280'
                  : linkType.type === 'custom'
                  ? '#374151'
                  : '#fff',
                border:
                  linkType.type === 'custom' ? '1px solid #D1D5DB' : 'none',
                '&:hover': {
                  backgroundColor: isLinkTypeAdded(linkType.type)
                    ? '#F3F4F6'
                    : linkType.type === 'custom'
                    ? '#F3F4F6'
                    : '#1A1A1A',
                },
                '&:disabled': {
                  backgroundColor: '#F3F4F6',
                  color: '#9CA3AF',
                },
              },
            }}
          >
            {linkType.label}
          </Button>
        ))}
      </Group>

      {/* Dynamic Link Inputs */}
      {links.map((link) => (
        <Group key={link.id} align="center" mb={16} gap={16}>
          <Box style={{ minWidth: 100 }}>
            <Text style={{ fontWeight: 600, fontSize: 14, color: '#374151' }}>
              {link.label}
            </Text>
          </Box>
          <TextInput
            placeholder={link.placeholder}
            value={link.url}
            onChange={(e) => updateLink(link.id, 'url', e.target.value)}
            style={{ flex: 1, maxWidth: 460, width: '100%' }}
            radius="sm"
            size="sm"
          />
          <Button
            onClick={() => removeLink(link.id)}
            variant="light"
            color="gray"
            size="sm"
            p={'sm'}
            styles={{
              root: {
                minWidth: 'auto',
                '&:hover': {
                  backgroundColor: '#FEE2E2',
                  color: '#DC2626',
                },
              },
            }}
          >
            <IconMinus size={16} />
          </Button>
        </Group>
      ))}
    </Box>
  );
}
