'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Text,
  Stack,
  Group,
  Button,
  Alert,
  Divider,
  ScrollArea,
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { editProjectSchema } from '@/lib/validations/project';
import type {
  EditProjectFormData,
  ProjectDetails,
  ProjectMemberInput,
  ProjectLinkInput,
} from '@/types/project';
import {
  ProjectBasicInfoFields,
  ProjectLinksFields,
  ProjectSubmissionSettingsFields,
  ProjectTeamFields,
  ProjectValidationSettingsFields,
} from './ProjectFormSections';
import { trpc } from '@/utils/trpc';

interface ProjectEditModalProps {
  project: ProjectDetails;
  opened: boolean;
  onClose: () => void;
  // eslint-disable-next-line no-unused-vars
  onProjectUpdated?: (project: ProjectDetails) => void;
}

const buildMemberInputs = (project: ProjectDetails): ProjectMemberInput[] => {
  if (!project.members?.length) {
    return [];
  }

  return project.members.map((member) => ({
    address: member.user.walletAddress,
    isValidator: member.role.includes('VALIDATOR'),
    isContributor: member.role.includes('CONTRIBUTOR'),
    isAdmin: member.role.includes('ADMIN'),
  }));
};

const buildFormValues = (project: ProjectDetails): EditProjectFormData => ({
  projectId: project.id,
  projectKey: project.key,
  logo: project.logo ?? null,
  projectName: project.name,
  description: project.description,
  tokenName: project.tokenSymbol || '',
  validateType:
    project.validateType === 'ALL_MEMBERS' ? 'all' : ('specific' as const),
  validationStrategy:
    (project.approvalStrategy?.strategy as EditProjectFormData['validationStrategy']) ||
    'simple',
  validationPeriodDays: project.approvalStrategy?.periodDays ?? 0,
  submitterType:
    project.submitStrategy === 'RESTRICTED'
      ? 'restricted'
      : ('everyone' as const),
  defaultHourlyPay:
    typeof project.defaultHourRate === 'number'
      ? project.defaultHourRate
      : null,
  projectOwner: project.owner.walletAddress,
  members: buildMemberInputs(project),
  otherLinks: (project.links?.otherLinks as ProjectLinkInput[]) || [],
});

export function ProjectEditModal({
  project,
  opened,
  onClose,
  onProjectUpdated,
}: ProjectEditModalProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmClose, setConfirmClose] = useState(false);

  const defaultValues = useMemo(() => buildFormValues(project), [project]);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<EditProjectFormData>({
    resolver: yupResolver<EditProjectFormData>(editProjectSchema),
    defaultValues,
    mode: 'onBlur',
  });

  const utils = trpc.useContext();
  const updateProjectMutation = trpc.project.update.useMutation({
    onSuccess: (data) => {
      setSubmitError(null);
      if (data.project) {
        onProjectUpdated?.(data.project as ProjectDetails);
        reset(buildFormValues(data.project as ProjectDetails), {
          keepDirty: false,
        });
      }
      setConfirmClose(false);
      onClose();
      void utils.project.get.invalidate({ id: project.id }).catch(() => {
        // ignore cache errors
      });
    },
    onError: (error) => {
      setSubmitError(error.message || 'Failed to update project.');
    },
  });

  useEffect(() => {
    if (opened) {
      reset(defaultValues, { keepDirty: false });
      setSubmitError(null);
    }
  }, [opened, defaultValues, reset]);

  const sanitizeMembers = (members?: ProjectMemberInput[]) => {
    if (!members || members.length === 0) return [];
    return members
      .map((member) => ({
        ...member,
        address: member.address.trim(),
      }))
      .filter((member) => member.address.length > 0);
  };

  const sanitizeLinks = (links?: ProjectLinkInput[]) => {
    if (!links || links.length === 0) return [];
    return links
      .map((link) => ({
        ...link,
        url: link.url.trim(),
      }))
      .filter((link) => link.url.length > 0);
  };

  const onSubmit = async (data: EditProjectFormData) => {
    setSubmitError(null);
    const members = sanitizeMembers(data.members);
    const otherLinks = sanitizeLinks(data.otherLinks);

    try {
      await updateProjectMutation.mutateAsync({
        projectId: project.id,
        payload: {
          logo: data.logo ?? null,
          projectName: data.projectName,
          description: data.description,
          tokenName: data.tokenName,
          validateType: data.validateType,
          validationStrategy: data.validationStrategy,
          validationPeriodDays:
            data.validateType === 'all' ? data.validationPeriodDays : 0,
          submitterType: data.submitterType,
          defaultHourlyPay:
            data.defaultHourlyPay === null ? null : data.defaultHourlyPay,
          projectOwner: data.projectOwner,
          members,
          otherLinks,
        },
      });
    } catch {
      // handled in onError
    }
  };

  const handleRequestClose = () => {
    if (isDirty && !updateProjectMutation.isPending) {
      setConfirmClose(true);
      return;
    }

    if (!updateProjectMutation.isPending) {
      reset(defaultValues, { keepDirty: false });
      setSubmitError(null);
      onClose();
    }
  };

  const handleDiscardChanges = () => {
    setConfirmClose(false);
    reset(defaultValues, { keepDirty: false });
    setSubmitError(null);
    onClose();
  };

  return (
    <>
      <Modal
        opened={opened}
        onClose={handleRequestClose}
        title="Edit Project"
        size="768px"
        centered
        closeOnClickOutside={!updateProjectMutation.isPending}
        closeOnEscape={!updateProjectMutation.isPending}
        scrollAreaComponent={ScrollArea.Autosize}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack gap="xl">
            {submitError && (
              <Alert
                color="red"
                variant="light"
                icon={<IconAlertCircle size={16} />}
              >
                {submitError}
              </Alert>
            )}

            <Stack gap="lg">
              <Text fw={700} size="lg">
                Basic Information
              </Text>

              <ProjectBasicInfoFields
                control={control}
                errors={errors}
                watch={watch}
                requireLogo={false}
                showSlugPreview
                slugBasePath="/project/"
                slugFallback={project.key}
              />
            </Stack>

            <Divider />

            <Stack gap="lg">
              <Text fw={700} size="lg">
                Validation Strategy
              </Text>

              <ProjectValidationSettingsFields
                control={control}
                errors={errors}
                watch={watch}
              />
            </Stack>

            <Divider />

            <Stack gap="lg">
              <Text fw={700} size="lg">
                Submission Settings
              </Text>

              <ProjectSubmissionSettingsFields
                control={control}
                errors={errors}
                watch={watch}
              />
            </Stack>

            <Divider />

            <Stack gap="lg">
              <Text fw={700} size="lg">
                Team Management
              </Text>

              <ProjectTeamFields
                control={control}
                errors={errors}
                ownerAddress={project.owner.walletAddress}
              />
            </Stack>

            <Divider />

            <Stack gap="lg">
              <Text fw={700} size="lg">
                Social Links
              </Text>

              <ProjectLinksFields control={control} />
            </Stack>

            <Group justify="flex-end" gap="sm">
              <Button
                variant="light"
                color="gray"
                onClick={handleRequestClose}
                disabled={updateProjectMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={updateProjectMutation.isPending}
              >
                Save Changes
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <Modal
        opened={confirmClose}
        onClose={() => setConfirmClose(false)}
        title="Discard changes?"
        centered
        size="sm"
      >
        <Stack gap="md">
          <Text>
            You have unsaved changes. Are you sure you want to close the editor?
          </Text>
          <Group justify="flex-end" gap="sm">
            <Button variant="light" onClick={() => setConfirmClose(false)}>
              Keep Editing
            </Button>
            <Button color="red" onClick={handleDiscardChanges}>
              Discard
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
