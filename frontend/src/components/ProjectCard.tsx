'use client';

import { Card, Group, Text, Button, Avatar, Stack } from '@mantine/core';
import {
  IconArrowRight,
  IconBookmark,
  IconBookmarkFilled,
} from '@tabler/icons-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { trpc } from '@/utils/trpc';
import { useAccount } from 'wagmi';

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
  const { isConnected } = useAccount();

  // TRPC utils and mutations for follow/unfollow
  const utils = trpc.useUtils();
  const followMutation = trpc.project.follow.useMutation({
    onSuccess: () => {
      // Invalidate counts so Following tab updates
      void utils.project.getCounts.invalidate();
      // Also invalidate list queries to keep cards in sync
      void utils.project.list.invalidate();
    },
  });
  const unfollowMutation = trpc.project.unfollow.useMutation({
    onSuccess: () => {
      // Invalidate counts so Following tab updates
      void utils.project.getCounts.invalidate();
      // Also invalidate list queries to keep cards in sync
      void utils.project.list.invalidate();
    },
  });

  useEffect(() => {
    setFollowed(isFollowed);
  }, [isFollowed]);

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!isConnected) {
      // Could show login modal here
      return;
    }

    const previousState = followed;
    const nextState = !followed;
    setFollowed(nextState);

    try {
      if (previousState) {
        await unfollowMutation.mutateAsync({ projectKey: id });
      } else {
        await followMutation.mutateAsync({ projectKey: id });
      }
      onFollow?.();
    } catch (error) {
      console.error('Error toggling follow:', error);
      setFollowed(previousState);
      // Could show error notification here
    }
  };

  const isFollowLoading =
    followMutation.isPending || unfollowMutation.isPending;

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
        <Link href={`/project/${id}`} style={{ textDecoration: 'none' }}>
          <Avatar src={logo} size={48} radius="md">
            {title.charAt(0)}
          </Avatar>
        </Link>

        <Button
          variant={followed ? 'filled' : 'outline'}
          size="xs"
          radius="md"
          onClick={handleFollow}
          disabled={isFollowLoading || !isConnected}
          loading={isFollowLoading}
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
              opacity: !isConnected ? 0.5 : 1,
              '&:hover': {
                backgroundColor: followed ? '#FACC15' : '#f8f9fa',
              },
            },
          }}
        >
          {!isConnected ? 'Connect Wallet' : followed ? 'Followed' : 'Follow'}
        </Button>
      </Group>

      <Link href={`/project/${id}`} style={{ textDecoration: 'none', flex: 1 }}>
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
          <Link href={`/project/${id}`} style={{ textDecoration: 'none' }}>
            <Button size="sm" radius="md" color="secondary" p={10}>
              <IconArrowRight size={16} />
            </Button>
          </Link>
        )}
      </Group>
    </Card>
  );
}
