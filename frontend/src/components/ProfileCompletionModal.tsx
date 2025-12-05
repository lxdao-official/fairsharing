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
  Box,
} from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';
import { trpc } from '@/utils/trpc';
import { ImageUpload } from './ImageUpload';
import { broadcastProfileUpdated } from '@/utils/profileEvents';

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

export type ProfileUser = {
  id: string;
  walletAddress: string;
  ensName?: string | null;
  name?: string | null;
  avatar?: string | null;
  bio?: string | null;
  links?: Record<string, string> | null;
};

type ProfileCompletionModalProps = {
  opened: boolean;
  onClose: () => void;
  mode?: 'onboarding' | 'edit';
  profileIdentifier?: string;
  user?: ProfileUser;
  onProfileUpdated?: (_updated: ProfileUser) => void;
};

export function ProfileCompletionModal({
  opened,
  onClose,
  mode = 'onboarding',
  profileIdentifier,
  user,
  onProfileUpdated,
}: ProfileCompletionModalProps) {
  const utils = trpc.useUtils();
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [linkValues, setLinkValues] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const isEditMode = mode === 'edit';

  useEffect(() => {
    if (!opened) return;
    setName(user?.name || '');
    setAvatar(user?.avatar || '');
    setBio(user?.bio || '');
    const defaults = SOCIAL_FIELDS.reduce(
      (acc, field) => ({
        ...acc,
        [field.key]:
          typeof user?.links?.[field.key] === 'string'
            ? (user?.links?.[field.key] as string)
            : '',
      }),
      {} as Record<string, string>,
    );
    setLinkValues(defaults);
    setFormError(null);
    setAvatarError(null);
  }, [opened, user]);

  const cleanedLinks = useMemo(() => {
    return Object.fromEntries(
      Object.entries(linkValues || {}).filter(
        ([, value]) => typeof value === 'string' && value.trim(),
      ),
    );
  }, [linkValues]);

  const updateProfileMutation = trpc.user.updateProfile.useMutation({
    onSuccess: async (data) => {
      const nextUser: ProfileUser = {
        id: data.user.id,
        walletAddress: data.user.walletAddress,
        ensName: data.user.ensName,
        name: data.user.name,
        avatar: data.user.avatar,
        bio: data.user.bio,
        links: data.user.links as Record<string, string> | null | undefined,
      };

      patchPublicProfileCache(nextUser);
      onProfileUpdated?.(nextUser);
      broadcastProfileUpdated({
        user: {
          id: nextUser.id,
          walletAddress: nextUser.walletAddress,
          name: nextUser.name,
          avatar: nextUser.avatar,
        },
      });
      setFormError(null);

      const invalidations: Array<Promise<unknown>> = [
        utils.user.getProfileCompletionStatus.invalidate(),
        utils.user.getProfileStats.invalidate({ userId: data.user.id }),
        utils.user.getPublicProfile.invalidate({
          addressOrEns: data.user.walletAddress,
        }),
        utils.user.getPublicProfile.invalidate(),
      ];

      if (data.user.ensName) {
        invalidations.push(
          utils.user.getPublicProfile.invalidate({
            addressOrEns: data.user.ensName,
          }),
        );
      }

      if (profileIdentifier && profileIdentifier.trim().length > 0) {
        invalidations.push(
          utils.user.getPublicProfile.invalidate({
            addressOrEns: profileIdentifier,
          }),
        );
      }

      await Promise.all(invalidations);
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
    setAvatarError(null);
    const trimmedName = name.trim();
    const trimmedAvatar = avatar.trim();

    if (!trimmedAvatar) {
      setAvatarError('Please upload an avatar image.');
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

  const handleAvatarChange = (url: string | null) => {
    setAvatar(url || '');
    setAvatarError(null);
  };

  const patchPublicProfileCache = (nextUser: ProfileUser) => {
    const identifiers = Array.from(
      new Set(
        [
          nextUser.walletAddress,
          nextUser.ensName ?? undefined,
          profileIdentifier,
        ].filter(
          (identifier): identifier is string =>
            !!identifier && identifier.trim().length > 0,
        ),
      ),
    );

    identifiers.forEach((identifier) => {
      utils.user.getPublicProfile.setData(
        { addressOrEns: identifier },
        (previous) =>
          previous
            ? {
                ...previous,
                user: {
                  ...previous.user,
                  ...nextUser,
                },
              }
            : previous,
      );
    });
  };

  return (
    <Modal
      opened={opened}
      onClose={isEditMode ? onClose : () => {}}
      withCloseButton={isEditMode}
      closeOnClickOutside={isEditMode}
      closeOnEscape={isEditMode}
      title={isEditMode ? 'Edit your profile' : 'Complete your profile'}
      size="lg"
      radius="lg"
    >
      <Stack gap={16}>
        <Text c="dimmed">
          {isEditMode
            ? 'Keep your profile details up to date so projects can recognize you.'
            : 'Add a display name and avatar so projects can recognize you across the ecosystem.'}
        </Text>

        {formError && (
          <Alert color="red" icon={<IconInfoCircle size={16} />}>
            {formError}
          </Alert>
        )}

        <Box>
          <Stack gap={8} align="center">
            <ImageUpload
              value={avatar}
              onChange={handleAvatarChange}
              size={140}
              placeholder="Upload your avatar"
              error={avatarError || undefined}
              variant="circle"
            />
            <Text size="sm" c="dimmed">
              Use a clear image at least 240px to avoid blurring.
            </Text>
          </Stack>
        </Box>

        <TextInput
          label="Display name"
          placeholder="e.g. Bruce"
          value={name}
          onChange={(event) => {
            const value = event.currentTarget.value;
            setName(value);
          }}
          autoFocus
        />

        <Textarea
          label="Bio"
          placeholder="Tell the community about your focus areas..."
          minRows={3}
          value={bio}
          onChange={(event) => {
            const value = event.currentTarget.value;
            setBio(value);
          }}
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
              onChange={(event) => {
                const value = event.currentTarget.value;
                setLinkValues((prev) => ({
                  ...prev,
                  [field.key]: value,
                }));
              }}
            />
          ))}
        </Stack>

        <Group justify="space-between" mt="sm">
          <Button
            variant="subtle"
            color="gray"
            onClick={isEditMode ? onClose : handleSkip}
            disabled={updateProfileMutation.isPending}
            loading={!isEditMode && dismissPromptMutation.isPending}
          >
            {isEditMode ? 'Cancel' : 'Not now'}
          </Button>
          <Button
            onClick={handleSave}
            loading={updateProfileMutation.isPending}
            disabled={updateProfileMutation.isPending}
          >
            {isEditMode ? 'Save changes' : 'Save & Continue'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
