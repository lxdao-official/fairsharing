'use client';

import {
  Modal,
  Stack,
  Text,
  TextInput,
  Textarea,
  Group,
  Button,
  Alert,
} from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';
import { trpc } from '@/utils/trpc';

const SOCIAL_FIELDS = [
  {
    key: 'twitter',
    label: 'Twitter URL',
    placeholder: 'https://twitter.com/yourhandle',
  },
  {
    key: 'github',
    label: 'GitHub URL',
    placeholder: 'https://github.com/username',
  },
  {
    key: 'website',
    label: 'Website',
    placeholder: 'https://yourdomain.xyz',
  },
  {
    key: 'telegram',
    label: 'Telegram',
    placeholder: 'https://t.me/username',
  },
];

type ProfileCompletionModalProps = {
  opened: boolean;
  onClose: () => void;
  user?: {
    id: string;
    walletAddress: string;
    ensName?: string | null;
    name?: string | null;
    avatar?: string | null;
    bio?: string | null;
    links?: Record<string, string> | null;
  };
  onProfileUpdated?: (_updated: {
    id: string;
    walletAddress: string;
    name?: string | null;
    avatar?: string | null;
    bio?: string | null;
    links?: Record<string, string> | null;
  }) => void;
};

export function ProfileCompletionModal({
  opened,
  onClose,
  user,
  onProfileUpdated,
}: ProfileCompletionModalProps) {
  const utils = trpc.useUtils();
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [linkValues, setLinkValues] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!opened) return;
    setName(user?.name || '');
    setAvatar(user?.avatar || '');
    setBio(user?.bio || '');
    const defaults = SOCIAL_FIELDS.reduce(
      (acc, field) => ({
        ...acc,
        [field.key]: user?.links?.[field.key] || '',
      }),
      {} as Record<string, string>,
    );
    setLinkValues({
      ...defaults,
      ...(user?.links || {}),
    });
    setFormError(null);
  }, [opened, user]);

  const cleanedLinks = useMemo(() => {
    return Object.fromEntries(
      Object.entries(linkValues || {}).filter(([, value]) => value.trim()),
    );
  }, [linkValues]);

  const updateProfileMutation = trpc.user.updateProfile.useMutation({
    onSuccess: async (data) => {
      await Promise.all([
        utils.user.getProfileCompletionStatus.invalidate(),
        utils.user.getProfileStats.invalidate({ userId: data.user.id }),
        utils.user.getPublicProfile.invalidate({
          addressOrEns: data.user.walletAddress,
        }),
      ]);
      onProfileUpdated?.(data.user);
      setFormError(null);
      onClose();
    },
    onError: (error) => {
      setFormError(error.message);
    },
  });

  const dismissPromptMutation = trpc.user.dismissProfilePrompt.useMutation({
    onSuccess: async () => {
      await utils.user.getProfileCompletionStatus.invalidate();
      onClose();
    },
    onError: (error) => setFormError(error.message),
  });

  const handleSave = () => {
    setFormError(null);
    const trimmedName = name.trim();
    const trimmedAvatar = avatar.trim();

    if (!trimmedAvatar) {
      setFormError('Please provide an avatar URL.');
      return;
    }

    if (!trimmedName && !user?.ensName) {
      setFormError('Please add a display name.');
      return;
    }

    updateProfileMutation.mutate({
      name: trimmedName || undefined,
      avatar: trimmedAvatar,
      bio: bio.trim() || undefined,
      links: Object.keys(cleanedLinks).length ? cleanedLinks : undefined,
    });
  };

  const handleSkip = () => {
    dismissPromptMutation.mutate();
  };

  return (
    <Modal
      opened={opened}
      onClose={() => {}}
      withCloseButton={false}
      closeOnClickOutside={false}
      closeOnEscape={false}
      title="Complete your profile"
      size="lg"
      radius="lg"
    >
      <Stack gap={16}>
        <Text c="dimmed">
          Add a display name and avatar so projects can recognize you across the
          ecosystem.
        </Text>

        {formError && (
          <Alert color="red" icon={<IconInfoCircle size={16} />}>
            {formError}
          </Alert>
        )}

        <TextInput
          label="Display name"
          placeholder="e.g. Bruce"
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
          autoFocus
        />

        <TextInput
          label="Avatar URL"
          placeholder="https://..."
          value={avatar}
          onChange={(event) => setAvatar(event.currentTarget.value)}
          required
        />

        <Textarea
          label="Bio"
          placeholder="Tell the community about your focus areas..."
          minRows={3}
          value={bio}
          onChange={(event) => setBio(event.currentTarget.value)}
        />

        <Stack gap={8}>
          <Text size="sm" fw={600}>
            Links
          </Text>
          {SOCIAL_FIELDS.map((field) => (
            <TextInput
              key={field.key}
              label={field.label}
              placeholder={field.placeholder}
              value={linkValues[field.key] || ''}
              onChange={(event) =>
                setLinkValues((prev) => ({
                  ...prev,
                  [field.key]: event.currentTarget.value,
                }))
              }
            />
          ))}
        </Stack>

        <Group justify="space-between" mt="sm">
          <Button
            variant="subtle"
            color="gray"
            onClick={handleSkip}
            disabled={updateProfileMutation.isPending}
            loading={dismissPromptMutation.isPending}
          >
            Not now
          </Button>
          <Button
            onClick={handleSave}
            loading={updateProfileMutation.isPending}
            disabled={updateProfileMutation.isPending}
          >
            Save & Continue
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
