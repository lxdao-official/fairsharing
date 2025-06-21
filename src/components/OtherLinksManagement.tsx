import React from 'react';
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

// External link interface for form data
export interface LinkItem {
  type: 'twitter' | 'telegram' | 'website' | 'github' | 'discord' | 'custom';
  url: string;
}

// Internal interface for UI rendering (includes UI properties)
interface InternalLinkItem extends LinkItem {
  id: string;
  label: string;
  placeholder: string;
}

interface OtherLinksManagementProps {
  value?: LinkItem[];
  onChange?: (links: LinkItem[]) => void;
}

function OtherLinksManagement({
  value = [],
  onChange,
}: OtherLinksManagementProps) {
  const predefinedLinks = [
    {
      type: 'twitter' as const,
      label: 'Twitter',
      placeholder: 'https://twitter.com/...',
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
      type: 'github' as const,
      label: 'GitHub',
      placeholder: 'https://github.com/...',
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

  // Convert external links to internal format for rendering
  const internalLinks: InternalLinkItem[] = React.useMemo(() => {
    return value.map((link, index) => {
      const predefined = predefinedLinks.find((p) => p.type === link.type);
      return {
        id: `link-${index}`, // Use stable index-based ID
        type: link.type,
        label: predefined?.label || 'Custom Link',
        placeholder: predefined?.placeholder || 'https://...',
        url: link.url,
      };
    });
  }, [value]);

  const addLink = (type: LinkItem['type']) => {
    const newLink: LinkItem = {
      type,
      url: '',
    };
    onChange?.([...value, newLink]);
  };

  const updateLink = (
    index: number,
    field: keyof LinkItem,
    newValue: string,
  ) => {
    const updatedLinks = value.map((link, i) =>
      i === index ? { ...link, [field]: newValue } : link,
    );
    onChange?.(updatedLinks);
  };

  const removeLink = (index: number) => {
    const filteredLinks = value.filter((_, i) => i !== index);
    onChange?.(filteredLinks);
  };

  const isLinkTypeAdded = (type: LinkItem['type']) => {
    return value.some((link) => link.type === type);
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
      {internalLinks.map((link, index) => (
        <Group key={link.id} align="center" mb={16} gap={16}>
          <Box style={{ minWidth: 100 }}>
            <Text style={{ fontWeight: 600, fontSize: 14, color: '#374151' }}>
              {link.label}
            </Text>
          </Box>
          <TextInput
            placeholder={link.placeholder}
            value={link.url}
            onChange={(e) => updateLink(index, 'url', e.target.value)}
            style={{ flex: 1, maxWidth: 460, width: '100%' }}
            radius="sm"
            size="sm"
          />
          <Button
            onClick={() => removeLink(index)}
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

export default OtherLinksManagement;
