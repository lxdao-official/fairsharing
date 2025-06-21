import { useState, useEffect } from 'react';
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
import { generateId } from '@/utils/generateId';

// Internal link interface with ID and UI data for component state
interface InternalLinkItem {
  id: string;
  type: 'x' | 'telegram' | 'website' | 'snapshot' | 'discord' | 'custom';
  label: string;
  placeholder: string;
  url: string;
}

// External link interface without ID and UI data for form data
export interface LinkItem {
  type: 'x' | 'telegram' | 'website' | 'snapshot' | 'discord' | 'custom';
  url: string;
}

interface OtherLinksManagementProps {
  value?: LinkItem[];
  onChange?: (links: LinkItem[]) => void;
}

function OtherLinksManagement({
  value = [],
  onChange,
}: OtherLinksManagementProps) {
  const [internalLinks, setInternalLinks] = useState<InternalLinkItem[]>([]);

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

  // Convert external links to internal links with IDs and UI data
  useEffect(() => {
    const convertedLinks = value.map((link) => {
      const predefined = predefinedLinks.find((p) => p.type === link.type);
      return {
        id: generateId(),
        type: link.type,
        label: predefined?.label || 'Custom Link',
        placeholder: predefined?.placeholder || 'https://...',
        url: link.url,
      };
    });
    setInternalLinks(convertedLinks);
  }, [value]);

  const addLink = (type: InternalLinkItem['type']) => {
    const newLink: InternalLinkItem = {
      id: generateId(),
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
    const updatedLinks = [...internalLinks, newLink];
    setInternalLinks(updatedLinks);

    // Transform data to remove id, label, placeholder before sending to parent
    const transformedLinks = updatedLinks.map(
      ({ id, label, placeholder, ...rest }) => rest,
    );
    onChange?.(transformedLinks);
  };

  const updateLink = (
    id: string,
    field: keyof InternalLinkItem,
    value: string,
  ) => {
    const updatedLinks = internalLinks.map((link) =>
      link.id === id ? { ...link, [field]: value } : link,
    );
    setInternalLinks(updatedLinks);

    // Transform data to remove id, label, placeholder before sending to parent
    const transformedLinks = updatedLinks.map(
      ({ id, label, placeholder, ...rest }) => rest,
    );
    onChange?.(transformedLinks);
  };

  const removeLink = (id: string) => {
    const filteredLinks = internalLinks.filter((link) => link.id !== id);
    setInternalLinks(filteredLinks);

    // Transform data to remove id, label, placeholder before sending to parent
    const transformedLinks = filteredLinks.map(
      ({ id, label, placeholder, ...rest }) => rest,
    );
    onChange?.(transformedLinks);
  };

  const isLinkTypeAdded = (type: InternalLinkItem['type']) => {
    return internalLinks.some((link) => link.type === type);
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
      {internalLinks.map((link) => (
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
