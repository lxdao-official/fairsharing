'use client';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import {
  Container,
  Title,
  Group,
  Text,
  TextInput,
  Stack,
  AppShell,
  Textarea,
  Box,
  Button,
  NumberInput,
} from '@mantine/core';
import { ValidateCardSelect } from '@/components/ValidateCardSelect';
import { SubmitterCardSelect } from '@/components/SubmitterCardSelect';
import { ValidationStrategySelect } from '@/components/ValidationStrategySelect';
import { MemberManagement } from '@/components/MemberManagement';
import { OtherLinksManagement } from '@/components/OtherLinksManagement';
import { ImageUpload } from '@/components/ImageUpload';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { createProjectSchema } from '@/lib/validations/project';
import { CreateProjectFormData } from '@/types/project';

export default function CreateProjectPage() {
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
      validationPeriodDays: 5,
      submitterType: 'everyone',
      defaultHourlyPay: 0,
      projectOwner: '',
    },
  });

  const tokenName = watch('tokenName') || 'TOKEN_NAME';

  const onSubmit = (data: CreateProjectFormData) => {
    console.log('=== Form Submission ===');
    console.log('📋 Basic Information:');
    console.log('  • Logo:', data.logo || 'Not uploaded');
    console.log('  • Project Name:', data.projectName);
    console.log('  • Description:', data.description);
    console.log('  • Token Name:', data.tokenName);

    console.log('⚙️ Validation Settings:');
    console.log('  • Who can validate:', data.validateType);
    console.log('  • Validation strategy:', data.validationStrategy);
    console.log('  • Validation period:', data.validationPeriodDays, 'days');

    console.log('👥 Submission Settings:');
    console.log('  • Who can submit:', data.submitterType);
    console.log(
      '  • Default hourly pay:',
      data.defaultHourlyPay,
      data.tokenName + '/hour',
    );

    console.log('🏢 Team Management:');
    console.log('  • Project owner:', data.projectOwner || 'Default (creator)');

    console.log('📝 Full Form Data:', JSON.stringify(data, null, 2));
    console.log('======================');

    // TODO: Add API call here
    alert('Form submitted successfully! Check console for details.');
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
          <form onSubmit={handleSubmit(onSubmit)}>
            <Group align="flex-start" gap={48}>
              <Title order={2}>Project Information</Title>
              <Stack style={{ flex: 1, maxWidth: 785 }}>
                {/* Project Logo Upload */}
                <Box>
                  <Text style={{ fontWeight: 700, fontSize: 16 }} mb={4}>
                    Project Logo
                    <span style={{ color: '#F43F5E', marginLeft: 4 }}>*</span>
                  </Text>
                  <Text
                    style={{ color: '#6B7280', fontSize: 14, marginBottom: 8 }}
                  >
                    Upload a square logo for your project (recommended size:
                    200x200px)
                  </Text>
                  <Controller
                    name="logo"
                    control={control}
                    render={({
                      field: { value, onChange },
                      fieldState: { error },
                    }) => (
                      <ImageUpload
                        value={value}
                        onChange={onChange}
                        size={200}
                        placeholder="Upload project logo"
                        error={error?.message}
                      />
                    )}
                  />
                </Box>

                <Controller
                  name="projectName"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <TextInput
                      {...field}
                      label={
                        <span style={{ fontWeight: 700, fontSize: 16 }}>
                          Project Name
                        </span>
                      }
                      required
                      placeholder="Enter project name"
                      radius="sm"
                      error={error?.message}
                    />
                  )}
                />

                <Controller
                  name="description"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <Textarea
                      {...field}
                      label={
                        <span style={{ fontWeight: 700, fontSize: 16 }}>
                          Description
                        </span>
                      }
                      required
                      description={
                        <span style={{ color: '#6B7280', fontSize: 16 }}>
                          No more than 150 characters
                        </span>
                      }
                      placeholder="Describe your project..."
                      minRows={5}
                      maxRows={8}
                      radius="sm"
                      error={error?.message}
                    />
                  )}
                />

                <Controller
                  name="tokenName"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <TextInput
                      {...field}
                      label={
                        <span style={{ fontWeight: 700, fontSize: 16 }}>
                          Token Name
                        </span>
                      }
                      required
                      description={
                        <span style={{ color: '#6B7280', fontSize: 16 }}>
                          Token representing contributions in your project
                          (doesn&apos;t have to be an on-chain token)
                        </span>
                      }
                      placeholder="TOKEN_NAME"
                      radius="sm"
                      styles={{
                        input: {
                          width: '160px',
                        },
                      }}
                      error={error?.message}
                    />
                  )}
                />

                {/* Who can validate contributions? */}
                <Box>
                  <Text style={{ fontWeight: 700, fontSize: 16 }}>
                    Who can validate contributions?
                    <span style={{ color: '#F43F5E', marginLeft: 4 }}>*</span>
                  </Text>
                  <Text
                    style={{
                      color: '#6B7280',
                      fontSize: 14,
                      marginBottom: 8,
                    }}
                  >
                    In FairSharing, contributions must be validated before
                    they&apos;re recorded on-chain. Select who will have the
                    authority to validate contributions for your project.
                  </Text>
                  <Controller
                    name="validateType"
                    control={control}
                    render={({
                      field: { value, onChange },
                      fieldState: { error },
                    }) => (
                      <ValidateCardSelect
                        value={value}
                        onChange={onChange}
                        error={error?.message}
                      />
                    )}
                  />
                </Box>

                <Box>
                  <Text style={{ fontWeight: 700, fontSize: 16 }}>
                    Validation Approval Strategy
                    <span style={{ color: '#F43F5E', marginLeft: 4 }}>*</span>
                  </Text>
                  <Text
                    style={{ color: '#6B7280', fontSize: 14, marginBottom: 8 }}
                  >
                    If you need furthur customization, please contact the
                    Fairsharing team.
                  </Text>
                  <Controller
                    name="validationStrategy"
                    control={control}
                    render={({
                      field: { value, onChange },
                      fieldState: { error },
                    }) => (
                      <ValidationStrategySelect
                        value={value}
                        onChange={onChange}
                        error={error?.message}
                      />
                    )}
                  />
                </Box>

                {/* Validation Period */}
                <Box>
                  <Text style={{ fontWeight: 700, fontSize: 16 }}>
                    Validation Period
                    <span style={{ color: '#F43F5E', marginLeft: 4 }}>*</span>
                  </Text>
                  <Group align="center" mt={8} mb={8}>
                    <Controller
                      name="validationPeriodDays"
                      control={control}
                      render={({ field, fieldState: { error } }) => (
                        <NumberInput
                          {...field}
                          placeholder="5"
                          style={{ width: 100 }}
                          radius="sm"
                          size="sm"
                          min={1}
                          max={365}
                          error={error?.message}
                        />
                      )}
                    />
                    <Text fw={800} style={{ color: '#6B7280' }}>
                      Days
                    </Text>
                  </Group>
                </Box>

                {/* Who can submit contributions? */}
                <Box>
                  <Text style={{ fontWeight: 700, fontSize: 16 }} mb={8}>
                    Who can submit contributions?
                    <span style={{ color: '#F43F5E', marginLeft: 4 }}>*</span>
                  </Text>
                  <Controller
                    name="submitterType"
                    control={control}
                    render={({
                      field: { value, onChange },
                      fieldState: { error },
                    }) => (
                      <SubmitterCardSelect
                        value={value}
                        onChange={onChange}
                        error={error?.message}
                      />
                    )}
                  />
                </Box>

                {/* Default Hourly Pay */}
                <Box>
                  <Text style={{ fontWeight: 700, fontSize: 16 }}>
                    Default Hourly Pay
                  </Text>
                  <Text
                    style={{ color: '#6B7280', fontSize: 14, marginBottom: 8 }}
                  >
                    Used to calculate contribution value as &apos;hours worked ×
                    hourly rate&apos;. You can later set custom rates for each
                    contributor. If left blank or set to 0, contributors can
                    claim tokens freely.
                  </Text>
                  <Group align="center" mt={8}>
                    <Controller
                      name="defaultHourlyPay"
                      control={control}
                      render={({ field, fieldState: { error } }) => (
                        <NumberInput
                          {...field}
                          placeholder="0"
                          style={{ width: 120 }}
                          radius="sm"
                          size="sm"
                          min={0}
                          max={10000}
                          error={error?.message}
                        />
                      )}
                    />
                    <Text style={{ color: '#6B7280', fontWeight: 800 }}>
                      {tokenName}/hour
                    </Text>
                  </Group>
                </Box>
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
                <Controller
                  name="projectOwner"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <TextInput
                      {...field}
                      label={
                        <span style={{ fontWeight: 700, fontSize: 16 }}>
                          Project Owner (Wallet address or ENS)
                        </span>
                      }
                      description={
                        <span style={{ color: '#6B7280', fontSize: 14 }}>
                          Defaults to the project creator.
                        </span>
                      }
                      placeholder="0x123456... or username.eth"
                      radius="sm"
                      size="md"
                      error={error?.message}
                    />
                  )}
                />

                {/* Member Management */}
                <Box mt={24}>
                  <MemberManagement />
                </Box>
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
                <OtherLinksManagement />
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
                  loading={isSubmitting}
                >
                  Create My Pie
                </Button>
              </Box>
            </Group>
          </form>
        </Container>
      </AppShell.Main>

      <AppShell.Footer style={{ position: 'static' }}>
        <Footer />
      </AppShell.Footer>
    </AppShell>
  );
}
