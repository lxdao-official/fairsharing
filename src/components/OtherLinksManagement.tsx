import { useState } from 'react';
import { Box, Group, Text, TextInput, Button } from '@mantine/core';
import {
  IconBrandX,
  IconBrandTelegram,
  IconWorld,
  IconCamera,
  IconBrandDiscord,
  IconPlus,
  IconMinus,
} from '@tabler/icons-react';

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

export { OtherLinksManagement };
