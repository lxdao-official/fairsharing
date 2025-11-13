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
import { useAccount } from 'wagmi';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function CreateProjectPage() {
  const { address } = useAccount();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const createProjectMutation = trpc.project.create.useMutation();
  const router = useRouter();
  
  const [successModal, setSuccessModal] = useState(false);
  const [createdProject, setCreatedProject] = useState<{name: string, key: string} | null>(null);

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
    console.log('=== Form Submission ===');
    console.log('Form Errors:', errors);
    console.log('📝 Full Form Data:', JSON.stringify(data, null, 2));

    // Check authentication before submitting
    if (!isAuthenticated) {
      alert(
        'Please connect your wallet and sign to authenticate before creating a project.',
      );
      return;
    }

    try {
      const result = await createProjectMutation.mutateAsync({
        ...data,
        validationStrategy: data.validationStrategy as
          | 'simple'
          | 'quorum'
          | 'absolute'
          | 'relative',
      });

      console.log('✅ Project created successfully:', result);
      setCreatedProject({
        name: result.project.name,
        key: result.project.key
      });
      setSuccessModal(true);
      
      // 3秒后自动跳转
      setTimeout(() => {
        router.push(`/project/${result.project.key}`);
      }, 3000);
    } catch (error: any) {
      console.error('❌ Error creating project:', error);

      // More specific error messages
      if (error?.message?.includes('No authentication token')) {
        alert(
          'Authentication failed. Please reconnect your wallet and try again.',
        );
      } else if (error?.message?.includes('UNAUTHORIZED')) {
        alert(
          'You are not authorized to perform this action. Please sign in again.',
        );
      } else {
        alert(`Failed to create project: ${error?.message || 'Unknown error'}`);
      }
    }
  };

  const onError = (errors: any) => {
    console.log('=== Form Validation Errors ===');
    console.log('Validation Errors:', errors);
    console.log('===============================');

    // Show first error message
    const firstError = Object.values(errors)[0] as any;
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
                    authLoading
                  }
                  disabled={
                    isSubmitting ||
                    createProjectMutation.isPending ||
                    authLoading ||
                    !isAuthenticated
                  }
                >
                  {authLoading
                    ? 'Loading...'
                    : createProjectMutation.isPending
                    ? 'Creating...'
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
