'use client';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import {
  Container,
  Title,
  Group,
  Text,
  Stack,
  AppShell,
  Box,
  Button,
  Alert,
  Modal,
} from '@mantine/core';
import {
  ProjectBasicInfoFields,
  ProjectLinksFields,
  ProjectSubmissionSettingsFields,
  ProjectTeamFields,
  ProjectValidationSettingsFields,
} from '@/components/ProjectFormSections';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { createProjectSchema } from '@/lib/validations/project';
import { CreateProjectFormData } from '@/types/project';
import { trpc } from '@/utils/trpc';
import { useAccount, usePublicClient, useWriteContract } from 'wagmi';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { decodeEventLog, keccak256, stringToHex, zeroAddress } from 'viem';
import { projectFactoryAbi } from '@/abi/projectFactory';

export default function CreateProjectPage() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const reserveProjectIdMutation = trpc.project.reserveId.useMutation();
  const createProjectMutation = trpc.project.create.useMutation();
  const utils = trpc.useUtils();
  const router = useRouter();
  
  const [successModal, setSuccessModal] = useState(false);
  const [createdProject, setCreatedProject] = useState<{name: string, key: string} | null>(null);
  const [isOnChainDeploying, setIsOnChainDeploying] = useState(false);

  const projectFactoryAddress = process.env
    .NEXT_PUBLIC_PROJECT_FACTORY_ADDRESS as `0x${string}` | undefined;
  const validationStrategyAddress = process.env
    .NEXT_PUBLIC_SIMPLE_VALIDATION_STRATEGY_ADDRESS as `0x${string}` | undefined;
  const zeroAddressValue = zeroAddress;

  const normalizeAddress = (value?: string | null) => {
    if (!value) return null;
    const trimmed = value.trim();
    if (/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
      return trimmed as `0x${string}`;
    }
    return null;
  };

  const buildMemberLists = (members: CreateProjectFormData['members'], ownerAddress: `0x${string}`) => {
    const adminSet = new Set<string>();
    const contributorSet = new Set<string>();
    const voterSet = new Set<string>();

    adminSet.add(ownerAddress);
    contributorSet.add(ownerAddress);
    voterSet.add(ownerAddress);

    members?.forEach((member) => {
      const normalized = normalizeAddress(member.address);
      if (!normalized) return;
      if (member.isAdmin) adminSet.add(normalized);
      if (member.isContributor) contributorSet.add(normalized);
      if (member.isValidator) voterSet.add(normalized);
    });

    return {
      admins: Array.from(adminSet) as `0x${string}`[],
      contributors: Array.from(contributorSet) as `0x${string}`[],
      voters: Array.from(voterSet) as `0x${string}`[],
    };
  };

  const extractProjectAddress = (receipt: {
    logs: Array<{
      address?: string;
      data: `0x${string}`;
      topics: `0x${string}`[];
    }>;
  }) => {
    if (!projectFactoryAddress) {
      return null;
    }
    for (const log of receipt.logs) {
      if (log.address?.toLowerCase() !== projectFactoryAddress.toLowerCase()) {
        continue;
      }
      try {
        const decoded = decodeEventLog({
          abi: projectFactoryAbi,
          data: log.data,
          topics: log.topics as [`0x${string}`, ...`0x${string}`[]],
        });
        if (decoded.eventName === 'ProjectCreated' && decoded.args) {
          return decoded.args.proxy as `0x${string}`;
        }
      } catch (error) {
        continue;
      }
    }
    return null;
  };

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<CreateProjectFormData>({
    resolver: yupResolver(createProjectSchema) as any,
    defaultValues: {
      logo: '',
      projectName: '',
      description: '',
      tokenName: '',
      validateType: 'specific',
      validationStrategy: 'simple',
      validationPeriodDays: 0,
      submitterType: 'everyone',
      defaultHourlyPay: 0,
      projectOwner: '',
      members: [],
      otherLinks: [],
    },
  });

  // Set project owner to current wallet address when available
  useEffect(() => {
    if (address) {
      setValue('projectOwner', address);
    }
  }, [address, setValue]);

  const onSubmit = async (data: CreateProjectFormData) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('=== Form Submission ===');
      console.log('Form Errors:', errors);
      console.log('📝 Full Form Data:', JSON.stringify(data, null, 2));
    }

    if (!projectFactoryAddress || !validationStrategyAddress) {
      alert('Project factory or validation strategy address is not configured.');
      return;
    }

    if (!publicClient) {
      alert('Wallet client unavailable. Refresh and try again.');
      return;
    }

    const ownerAddress = normalizeAddress(address);
    if (!ownerAddress) {
      alert('Please connect a wallet to deploy the project on chain.');
      return;
    }

    // Check authentication before submitting
    if (!isAuthenticated) {
      alert(
        'Please connect your wallet and sign to authenticate before creating a project.',
      );
      return;
    }

    const reserveResult = await reserveProjectIdMutation.mutateAsync();
    const reservedProjectId = reserveResult.projectId;
    const projectIdBytes32 = keccak256(stringToHex(reservedProjectId));
    const { admins, contributors, voters } = buildMemberLists(
      data.members,
      ownerAddress,
    );

    try {
      setIsOnChainDeploying(true);

      const txHash = await writeContractAsync({
        address: projectFactoryAddress,
        abi: projectFactoryAbi,
        functionName: 'createProject',
        args: [
          {
            projectId: projectIdBytes32,
            projectOwner: ownerAddress,
            name: data.projectName,
            metadataUri: '',
            orgAddress: zeroAddressValue,
            validateModel: data.validateType === 'specific' ? 1 : 0,
            contributionModel: data.submitterType === 'restricted' ? 1 : 0,
            validationStrategy: validationStrategyAddress,
            votingStrategy: zeroAddressValue,
            treasuryAddress: zeroAddressValue,
            admins,
            contributors,
            voters,
            tokenSymbol: data.tokenName,
          },
        ],
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      const projectAddress = extractProjectAddress(receipt);

      if (!projectAddress) {
        throw new Error('Unable to determine deployed project address from logs.');
      }

      const result = await createProjectMutation.mutateAsync({
        ...data,
        defaultHourlyPay: data.defaultHourlyPay ?? undefined,
        validationStrategy: data.validationStrategy as
          | 'simple'
          | 'quorum'
          | 'absolute'
          | 'relative',
            projectId: reservedProjectId,
            projectIdBytes32,
            onChainAddress: projectAddress,
          });

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Project created successfully:', result);
      }
      setCreatedProject({
        name: result.project.name,
        key: result.project.key
      });
      void utils.user.getSidebarProjects.invalidate();
      setSuccessModal(true);
      
      // 3秒后自动跳转
      setTimeout(() => {
        router.push(`/project/${result.project.key}`);
      }, 3000);
    } catch (error) {
      console.error('❌ Error creating project:', error);

      // More specific error messages
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('No authentication token')) {
        alert(
          'Authentication failed. Please reconnect your wallet and try again.',
        );
      } else if (errorMessage.includes('UNAUTHORIZED')) {
        alert(
          'You are not authorized to perform this action. Please sign in again.',
        );
      } else {
        alert(`Failed to create project: ${errorMessage}`);
      }
    } finally {
      setIsOnChainDeploying(false);
    }
  };

  const onError = (errors: Record<string, { message?: string }>) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('=== Form Validation Errors ===');
      console.log('Validation Errors:', errors);
      console.log('===============================');
    }

    // Show first error message
    const firstError = Object.values(errors)[0];
    if (firstError?.message) {
      alert(`Form validation failed: ${firstError.message}`);
    } else {
      alert('Form validation failed. Please check the console for details.');
    }
  };

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

          {!isAuthenticated && !authLoading && (
            <Alert color="yellow" mb="xl">
              Please connect your wallet and sign the authentication message to
              create a project.
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit, onError)}>
            <Group align="flex-start" gap={48}>
              <Title order={2}>Project Information</Title>
              <Stack style={{ flex: 1, maxWidth: 785 }}>
                <ProjectBasicInfoFields
                  control={control}
                  errors={errors}
                  watch={watch}
                  requireLogo
                  logoDescription="Upload a square logo for your project (recommended size: 200x200px)"
                />

                <ProjectValidationSettingsFields
                  control={control}
                  errors={errors}
                  watch={watch}
                />

                <ProjectSubmissionSettingsFields
                  control={control}
                  errors={errors}
                  watch={watch}
                />
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
                <ProjectTeamFields
                  control={control}
                  errors={errors}
                  ownerAddress={watch('projectOwner')}
                />
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
                <ProjectLinksFields control={control} />
              </Box>
            </Group>

            <Group justify="flex-end" gap={48} mt={24}>
              <Box style={{ minWidth: 260 }}></Box>
              <Box style={{ flex: 1 }}>
                <Button
                  type="submit"
                  size="md"
                  radius="md"
                  color="secondary"
                  loading={
                    isSubmitting ||
                    createProjectMutation.isPending ||
                    authLoading ||
                    isOnChainDeploying
                  }
                  disabled={
                    isSubmitting ||
                    createProjectMutation.isPending ||
                    isOnChainDeploying ||
                    authLoading ||
                    !isAuthenticated
                  }
                >
                  {authLoading
                    ? 'Loading...'
                    : createProjectMutation.isPending
                    ? 'Creating...'
                    : isOnChainDeploying
                    ? 'Deploying on chain...'
                    : !isAuthenticated
                    ? 'Connect Wallet to Create'
                    : 'Create My Pie'}
                </Button>
              </Box>
            </Group>
          </form>
        </Container>
      </AppShell.Main>

      <AppShell.Footer style={{ position: 'static' }}>
        <Footer />
      </AppShell.Footer>

      {/* Success Modal */}
      <Modal
        opened={successModal}
        onClose={() => setSuccessModal(false)}
        title="Project Created Successfully! 🎉"
        centered
        size="md"
      >
        <Stack gap={16}>
          <Text size="lg">
            Project <strong>{createdProject?.name}</strong> has been created successfully!
          </Text>
          <Text size="sm" c="dimmed">
            Project Key: <strong>{createdProject?.key}</strong>
          </Text>
          <Text size="sm" c="blue">
            You will be redirected to your project page in 3 seconds...
          </Text>
          <Button 
            onClick={() => router.push(`/project/${createdProject?.key}`)}
            variant="filled"
            color="blue"
          >
            Go to Project Now
          </Button>
        </Stack>
      </Modal>
    </AppShell>
  );
}
