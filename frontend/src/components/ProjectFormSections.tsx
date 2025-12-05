'use client';

import {
  Control,
  Controller,
  FieldErrors,
  UseFormWatch,
} from 'react-hook-form';
import {
  Box,
  Group,
  NumberInput,
  Stack,
  Text,
  TextInput,
  Textarea,
} from '@mantine/core';
import { ImageUpload } from './ImageUpload';
import { ValidateCardSelect } from './ValidateCardSelect';
import { ValidationStrategySelect } from './ValidationStrategySelect';
import { SubmitterCardSelect } from './SubmitterCardSelect';
import MemberManagement from './MemberManagement';
import OtherLinksManagement from './OtherLinksManagement';
import { AddressInput } from './AddressInput';
import type {
  ProjectLinkInput,
  ProjectMemberInput,
  SubmitterType,
  ValidateType,
  ValidationStrategy,
} from '@/types/project';
import { generateProjectKey } from '@/utils/project';

type ProjectFormValues = {
  logo: string | null;
  projectName: string;
  description: string;
  tokenName: string;
  validateType: ValidateType;
  validationStrategy: ValidationStrategy;
  validationPeriodDays?: number | null;
  submitterType: SubmitterType;
  defaultHourlyPay?: number | null;
  projectOwner: string;
  members?: ProjectMemberInput[];
  otherLinks?: ProjectLinkInput[];
};

type FormControl = Control<any>;
type FormErrors = FieldErrors<any>;

interface BasicInfoProps {
  control: FormControl;
  errors: FormErrors;
  watch: UseFormWatch<any>;
  requireLogo?: boolean;
  logoDescription?: string;
  showSlugPreview?: boolean;
  slugBasePath?: string;
  slugFallback?: string;
  readOnlyTokenName?: boolean;
}

export function ProjectBasicInfoFields({
  control,
  errors,
  watch,
  requireLogo = true,
  logoDescription = 'Upload a square logo for your project (recommended size: 200x200px)',
  showSlugPreview = false,
  slugBasePath = '/project/',
  slugFallback,
  readOnlyTokenName = false,
}: BasicInfoProps) {
  const projectName = watch('projectName') ?? '';
  const description = (watch('description') ?? '') as string;
  const tokenNameValue = (watch('tokenName') ?? '') as string;
  const tokenNamePlaceholder = tokenNameValue || 'TOKEN';
  const maxDescriptionLength = 150;
  const descriptionLength = Math.min(description.length, maxDescriptionLength);
  const maxTokenNameLength = 20;
  const tokenNameLength = Math.min(tokenNameValue.length, maxTokenNameLength);
  const slugPreview = generateProjectKey(projectName);

  return (
    <Stack gap="lg">
      <Box>
        <Text style={{ fontWeight: 700, fontSize: 16 }} mb={4}>
          Project Logo
          {requireLogo && (
            <span style={{ color: '#F43F5E', marginLeft: 4 }}>*</span>
          )}
        </Text>
        <Text style={{ color: '#6B7280', fontSize: 14, marginBottom: 8 }}>
          {logoDescription}
        </Text>
        <Controller
          name={'logo' as any}
          control={control as any}
          render={({ field: { value, onChange } }) => (
            <ImageUpload
              value={value}
              onChange={onChange}
              size={200}
              placeholder="Upload project logo"
              error={errors.logo?.message as string | undefined}
            />
          )}
        />
      </Box>

      <Controller
        name={'projectName' as any}
        control={control as any}
        render={({ field }) => (
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
            error={errors.projectName?.message as string | undefined}
          />
        )}
      />
      {showSlugPreview && (
        <Text size="sm" c="gray.6">
          Slug preview: {slugBasePath}
          {slugPreview || slugFallback || ''}
        </Text>
      )}

      <Controller
        name={'description' as any}
        control={control as any}
        render={({ field }) => (
          <Textarea
            {...field}
            maxLength={maxDescriptionLength}
            onChange={(event) => {
              const value = event.currentTarget.value.slice(
                0,
                maxDescriptionLength,
              );
              field.onChange(value);
            }}
            label={
              <span style={{ fontWeight: 700, fontSize: 16 }}>Description</span>
            }
            required
            description={
              <span style={{ color: '#6B7280', fontSize: 14 }}>
                No more than 150 characters
              </span>
            }
            minRows={5}
            maxRows={8}
            radius="sm"
            error={errors.description?.message as string | undefined}
          />
        )}
      />
      <Text size="xs" c="gray.6" ta="right">
        {descriptionLength}/{maxDescriptionLength} characters
      </Text>

      <Controller
        name={'tokenName' as any}
        control={control as any}
        render={({ field }) => (
          <TextInput
            {...field}
            onChange={(event) => {
              if (readOnlyTokenName) return;
              const value = event.currentTarget.value
                .replace(/[^A-Za-z0-9_]/g, '')
                .toUpperCase()
                .slice(0, maxTokenNameLength);
              field.onChange(value);
            }}
            label={
              <span style={{ fontWeight: 700, fontSize: 16 }}>
                Token Name
              </span>
            }
            required
            readOnly={readOnlyTokenName}
            maxLength={maxTokenNameLength}
            description={
              <span style={{ color: '#6B7280', fontSize: 16 }}>
                {readOnlyTokenName
                  ? 'Token name cannot be modified after project creation'
                  : 'Token representing contributions in your project (2-20 uppercase letters, numbers, or underscores)'}
              </span>
            }
            placeholder={tokenNamePlaceholder}
            radius="sm"
            styles={{
              input: {
                width: '160px',
                backgroundColor: readOnlyTokenName ? '#f5f5f5' : undefined,
                cursor: readOnlyTokenName ? 'not-allowed' : undefined,
              },
            }}
            error={errors.tokenName?.message as string | undefined}
          />
        )}
      />
      {!readOnlyTokenName && (
        <Text size="xs" c="gray.6" ta="right">
          {tokenNameLength}/{maxTokenNameLength} characters
        </Text>
      )}
    </Stack>
  );
}

interface ValidationProps {
  control: FormControl;
  errors: FormErrors;
  watch: UseFormWatch<any>;
}

export function ProjectValidationSettingsFields({
  control,
  errors,
  watch,
}: ValidationProps) {
  const validateType = watch('validateType');

  return (
    <Stack gap="lg">
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
          In FairSharing, contributions must be validated before they&apos;re
          recorded on-chain. Select who can validate contributions for your
          project.
        </Text>
        <Controller
          name={'validateType' as any}
          control={control as any}
          render={({ field: { value, onChange } }) => (
            <ValidateCardSelect
              value={value}
              onChange={onChange}
              error={errors.validateType?.message as string | undefined}
            />
          )}
        />
      </Box>

      <Box>
        <Text style={{ fontWeight: 700, fontSize: 16 }}>
          Validation Approval Strategy
          <span style={{ color: '#F43F5E', marginLeft: 4 }}>*</span>
        </Text>
        <Text style={{ color: '#6B7280', fontSize: 14, marginBottom: 8 }}>
          If you need further customization, please contact the FairSharing team.
        </Text>
        <Controller
          name={'validationStrategy' as any}
          control={control as any}
          render={({ field: { value, onChange } }) => (
            <ValidationStrategySelect
              value={value}
              onChange={onChange}
              error={errors.validationStrategy?.message as string | undefined}
            />
          )}
        />
      </Box>

      {validateType === 'all' && (
        <Box>
          <Text style={{ fontWeight: 700, fontSize: 16 }}>
            Validation Period
            <span style={{ color: '#F43F5E', marginLeft: 4 }}>*</span>
          </Text>
          <Text
            style={{
              color: '#6B7280',
              fontSize: 14,
              marginBottom: 8,
            }}
          >
            Set to 0 for immediate validation (as soon as votes reach the
            threshold).
          </Text>
          <Group align="center" mt={8} mb={8}>
            <Controller
              name={'validationPeriodDays' as any}
              control={control as any}
              render={({ field: { value, onChange } }) => (
                <NumberInput
                  value={value ?? 0}
                  onChange={(val) =>
                    onChange(typeof val === 'number' ? val : 0)
                  }
                  placeholder="0"
                  style={{ width: 100 }}
                  radius="sm"
                  size="sm"
                  min={0}
                  max={365}
                  error={
                    errors.validationPeriodDays?.message as string | undefined
                  }
                />
              )}
            />
            <Text fw={800} style={{ color: '#6B7280' }}>
              Days
            </Text>
          </Group>
        </Box>
      )}
    </Stack>
  );
}

interface SubmissionProps {
  control: FormControl;
  errors: FormErrors;
  watch: UseFormWatch<any>;
}

export function ProjectSubmissionSettingsFields({
  control,
  errors,
  watch,
}: SubmissionProps) {
  const tokenName = watch('tokenName') || 'TOKEN';

  return (
    <Stack gap="lg">
      <Box>
        <Text style={{ fontWeight: 700, fontSize: 16 }} mb={8}>
          Who can submit contributions?
          <span style={{ color: '#F43F5E', marginLeft: 4 }}>*</span>
        </Text>
        <Controller
          name={'submitterType' as any}
          control={control as any}
          render={({ field: { value, onChange } }) => (
            <SubmitterCardSelect
              value={value}
              onChange={onChange}
              error={errors.submitterType?.message as string | undefined}
            />
          )}
        />
      </Box>

      <Box>
        <Text style={{ fontWeight: 700, fontSize: 16 }}>Default Hourly Pay</Text>
        <Text style={{ color: '#6B7280', fontSize: 14, marginBottom: 8 }}>
          Used to calculate contribution value as &apos;hours worked × hourly
          rate&apos;. You can later set custom rates for each contributor. If
          left blank or set to 0, contributors can claim tokens freely.
        </Text>
        <Group align="center" mt={8}>
          <Controller
            name={'defaultHourlyPay' as any}
            control={control as any}
            render={({ field: { value, onChange } }) => (
              <NumberInput
                value={value ?? null}
                onChange={(val) =>
                  onChange(typeof val === 'number' ? val : null)
                }
                placeholder="0"
                style={{ width: 120 }}
                radius="sm"
                size="sm"
                min={0}
                max={10000}
                error={errors.defaultHourlyPay?.message as string | undefined}
              />
            )}
          />
          <Text style={{ color: '#6B7280', fontWeight: 800 }}>
            {tokenName || 'TOKEN'}/hour
          </Text>
        </Group>
      </Box>
    </Stack>
  );
}

interface TeamProps {
  control: FormControl;
  errors: FormErrors;
}

export function ProjectTeamFields({
  control,
  errors,
  ownerAddress,
}: TeamProps & { ownerAddress: string }) {
  return (
    <Stack gap="lg">
      <Controller
        name={'projectOwner' as any}
        control={control as any}
        render={({ field: { value, onChange } }) => (
          <AddressInput
            value={value}
            onChange={onChange}
            label={
              <span style={{ fontWeight: 700, fontSize: 16 }}>
                Project Owner (Wallet address or ENS)
                <span style={{ color: '#F43F5E', marginLeft: 4 }}>*</span>
              </span>
            }
            required
            description={
              <span style={{ color: '#6B7280', fontSize: 14 }}>
                Defaults to the project creator and with Admin permission.
              </span>
            }
            placeholder="0x123456... or username.eth"
            radius="sm"
            size="md"
            error={errors.projectOwner?.message as string | undefined}
          />
        )}
      />

      <Controller
        name={'members' as any}
        control={control as any}
        render={({ field: { value, onChange } }) => (
          <MemberManagement
            value={value}
            onChange={onChange}
            ownerAddress={ownerAddress}
          />
        )}
      />
    </Stack>
  );
}

interface LinksProps {
  control: FormControl;
}

export function ProjectLinksFields({
  control,
}: LinksProps) {
  return (
    <Controller
      name={'otherLinks' as any}
      control={control as any}
      render={({ field: { value, onChange } }) => (
        <OtherLinksManagement value={value} onChange={onChange} />
      )}
    />
  );
}
