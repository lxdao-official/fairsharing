'use client';

import { Card, Group, Text, Button, Avatar, Stack } from '@mantine/core';
import {
  IconArrowRight,
  IconBookmark,
  IconBookmarkFilled,
} from '@tabler/icons-react';
import Link from 'next/link';
import { useState } from 'react';

interface ProjectCardProps {
  title: string;
  id: string;
  description: string;
  contributions: string;
  pieBakers: string;
  logo?: string;

  isFollowed?: boolean;
  onFollow?: () => void;
  onClick?: () => void;
}

export function ProjectCard({
  title,
  id,
  description,
  contributions,
  pieBakers,
  logo,
  isFollowed = false,
  onFollow,
}: ProjectCardProps) {
  const [followed, setFollowed] = useState(isFollowed);
  const [isHovered, setIsHovered] = useState(false);

  const handleFollow = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFollowed(!followed);
    onFollow?.();
  };

  return (
    <Card
      shadow="none"
      padding="32px"
      radius="xl"
      withBorder
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        border: isHovered ? '1px solid #FDE047' : '1px solid #e9ecef',
        transition: 'all 0.2s ease',
        position: 'relative',
        height: 320,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: isHovered ? '#FFFEF9' : '#F9F9F9',
      }}
    >
      <Group justify="space-between" mb="md">
        <Link href={`/app/${id}`} style={{ textDecoration: 'none' }}>
          <Avatar src={logo} size={48} radius="md">
            {title.charAt(0)}
          </Avatar>
        </Link>

        <Button
          variant={followed ? 'filled' : 'outline'}
          size="xs"
          radius="md"
          onClick={handleFollow}
          rightSection={
            followed ? (
              <IconBookmarkFilled size={14} />
            ) : (
              <IconBookmark size={14} />
            )
          }
          color={followed ? '#FDE047' : 'gray'}
          styles={{
            root: {
              backgroundColor: followed ? '#FDE047' : 'transparent',
              color: followed ? '#000' : '#666',
              border: followed ? 'none' : '1px solid #ddd',
              fontWeight: 600,
              '&:hover': {
                backgroundColor: followed ? '#FACC15' : '#f8f9fa',
              },
            },
          }}
        >
          {followed ? 'Followed' : 'Follow'}
        </Button>
      </Group>

      <Link href={`/app/${id}`} style={{ textDecoration: 'none', flex: 1 }}>
        <Stack gap="xs" mb="lg" style={{ flex: 1, minHeight: 0 }}>
          <Text fw={700} size="lg" c="dark">
            {title}
          </Text>
          <Text
            size="sm"
            c="dimmed"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              minHeight: 44,
            }}
          >
            {description}
          </Text>
        </Stack>
      </Link>

      <Group justify="space-between" align="center" mt="auto">
        <Group>
          <Stack gap={2}>
            <Text size="xs" c="dimmed" fw={500}>
              Contributions
            </Text>
            <Text fw={700} size="lg">
              {contributions}
            </Text>
          </Stack>
          <Stack gap={2}>
            <Text size="xs" c="dimmed" fw={500}>
              Pie Bakers
            </Text>
            <Text fw={700} size="lg">
              {pieBakers}
            </Text>
          </Stack>
        </Group>

        {isHovered && (
          <Link href={`/app/${id}`} style={{ textDecoration: 'none' }}>
            <Button size="sm" radius="md" color="secondary" p={10}>
              <IconArrowRight size={16} />
            </Button>
          </Link>
        )}
      </Group>
    </Card>
  );
}
