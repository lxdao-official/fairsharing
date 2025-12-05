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
import { useAccount, usePublicClient, useWriteContract } from 'wagmi';
import { projectAbi } from '@/abi/project';

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

const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

type RoleSets = {
  admins: Set<string>;
  contributors: Set<string>;
  voters: Set<string>;
};

type RoleUpdateArgs = {
  addAdmins: `0x${string}`[];
  removeAdmins: `0x${string}`[];
  addContributors: `0x${string}`[];
  removeContributors: `0x${string}`[];
  addVoters: `0x${string}`[];
  removeVoters: `0x${string}`[];
};

const normalizeAddress = (value?: string | null): `0x${string}` | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (ADDRESS_REGEX.test(trimmed)) {
    return trimmed.toLowerCase() as `0x${string}`;
  }
  return null;
};

const buildRoleSetsFromProject = (project: ProjectDetails): RoleSets => {
  const roleSets: RoleSets = {
    admins: new Set<string>(),
    contributors: new Set<string>(),
    voters: new Set<string>(),
  };

  project.members.forEach((member) => {
    const normalized = normalizeAddress(member.user.walletAddress);
    if (!normalized) return;

    if (member.role.includes('ADMIN')) {
      roleSets.admins.add(normalized);
    }
    if (member.role.includes('CONTRIBUTOR')) {
      roleSets.contributors.add(normalized);
    }
    if (member.role.includes('VALIDATOR')) {
      roleSets.voters.add(normalized);
    }
  });

  const ownerAddress = normalizeAddress(project.owner.walletAddress);
  if (ownerAddress) {
    roleSets.admins.add(ownerAddress);
    roleSets.contributors.add(ownerAddress);
    roleSets.voters.add(ownerAddress);
  }

  return roleSets;
};

const buildRoleSetsFromForm = (
  ownerAddress: `0x${string}`,
  members?: ProjectMemberInput[],
): RoleSets => {
  const roleSets: RoleSets = {
    admins: new Set<string>([ownerAddress]),
    contributors: new Set<string>([ownerAddress]),
    voters: new Set<string>([ownerAddress]),
  };

  members?.forEach((member) => {
    const normalized = normalizeAddress(member.address);
    if (!normalized) return;
    if (member.isAdmin) {
      roleSets.admins.add(normalized);
    }
    if (member.isContributor) {
      roleSets.contributors.add(normalized);
    }
    if (member.isValidator) {
      roleSets.voters.add(normalized);
    }
  });

  return roleSets;
};

const diffRoleSets = (current: RoleSets, target: RoleSets): RoleUpdateArgs => {
  const buildAddList = (source: Set<string>, next: Set<string>) => {
    const result: `0x${string}`[] = [];
    next.forEach((value) => {
      if (!source.has(value)) {
        result.push(value as `0x${string}`);
      }
    });
    return result;
  };

  const buildRemoveList = (source: Set<string>, next: Set<string>) => {
    const result: `0x${string}`[] = [];
    source.forEach((value) => {
      if (!next.has(value)) {
        result.push(value as `0x${string}`);
      }
    });
    return result;
  };

  return {
    addAdmins: buildAddList(current.admins, target.admins),
    removeAdmins: buildRemoveList(current.admins, target.admins),
    addContributors: buildAddList(current.contributors, target.contributors),
    removeContributors: buildRemoveList(current.contributors, target.contributors),
    addVoters: buildAddList(current.voters, target.voters),
    removeVoters: buildRemoveList(current.voters, target.voters),
  };
};

const buildMetadataUri = (
  data: EditProjectFormData,
  links: ProjectLinkInput[],
) => {
  const payload = {
    name: data.projectName,
    description: data.description,
    logo: data.logo ?? null,
    tokenSymbol: data.tokenName,
    links,
    defaultHourlyPay: data.defaultHourlyPay,
    updatedAt: new Date().toISOString(),
  };

  return `data:application/json;utf8,${encodeURIComponent(JSON.stringify(payload))}`;
};

export function ProjectEditModal({
  project,
  opened,
  onClose,
  onProjectUpdated,
}: ProjectEditModalProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmClose, setConfirmClose] = useState(false);
  const [isOnChainUpdating, setIsOnChainUpdating] = useState(false);
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const { address } = useAccount();

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
    const contractAddress = normalizeAddress(project.onChainAddress);
    const ownerAddress = normalizeAddress(data.projectOwner);

    if (!contractAddress) {
      setSubmitError('Project is missing an on-chain address. Please contact support.');
      return;
    }

    if (!ownerAddress) {
      setSubmitError('Project owner must be a valid wallet address to sync on chain.');
      return;
    }

    if (!publicClient) {
      setSubmitError('Wallet client unavailable. Refresh and try again.');
      return;
    }

    const connectedAddress = normalizeAddress(address);
    if (connectedAddress && connectedAddress !== ownerAddress) {
      setSubmitError('Please connect the project owner wallet to update on-chain settings.');
      return;
    }

    for (const member of members) {
      if (!normalizeAddress(member.address)) {
        setSubmitError(
          `Member address "${member.address}" must be a valid wallet address for on-chain sync.`,
        );
        return;
      }
    }

    const currentRoles = buildRoleSetsFromProject(project);
    const targetRoles = buildRoleSetsFromForm(ownerAddress, members);
    const roleUpdates = diffRoleSets(currentRoles, targetRoles);
    const metadataUri = buildMetadataUri(data, otherLinks);

    setIsOnChainUpdating(true);

    try {
      const txHash = await writeContractAsync({
        address: contractAddress,
        abi: projectAbi,
        functionName: 'updateSettings',
        args: [
          {
            metadataUri,
            validateModel: data.validateType === 'specific' ? 1 : 0,
            contributionModel: data.submitterType === 'restricted' ? 1 : 0,
            roles: roleUpdates,
          },
        ],
      });

      await publicClient.waitForTransactionReceipt({ hash: txHash });

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
    } catch (error) {
      const errorMessage = error instanceof Error ?
        (error.message || 'Failed to update project.') :
        'Failed to update project.';
      setSubmitError(errorMessage);
    } finally {
      setIsOnChainUpdating(false);
    }
  };

  const handleRequestClose = () => {
    if (isDirty && !updateProjectMutation.isPending && !isOnChainUpdating) {
      setConfirmClose(true);
      return;
    }

    if (!updateProjectMutation.isPending && !isOnChainUpdating) {
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
        closeOnClickOutside={!updateProjectMutation.isPending && !isOnChainUpdating}
        closeOnEscape={!updateProjectMutation.isPending && !isOnChainUpdating}
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
                readOnlyTokenName={true}
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
                disabled={updateProjectMutation.isPending || isOnChainUpdating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={
                  updateProjectMutation.isPending || isOnChainUpdating
                }
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
