import * as yup from 'yup';

const memberSchema = yup.object().shape({
  address: yup.string().required('Member address is required'),
  isValidator: yup.boolean().required(),
  isContributor: yup.boolean().required(),
  isAdmin: yup.boolean().required(),
});

const otherLinkSchema = yup.object().shape({
  type: yup
    .string()
    .oneOf(
      ['twitter', 'telegram', 'website', 'github', 'discord', 'custom'],
      'Invalid link type',
    )
    .required(),
  url: yup
    .string()
    .required('URL is required')
    .matches(/^https?:\/\/.+/, 'URL must start with http:// or https://'),
});

const sharedProjectShape = {
  projectName: yup
    .string()
    .required('Project name is required')
    .min(2, 'Project name must be at least 2 characters')
    .max(50, 'Project name must not exceed 50 characters')
    .matches(
      /^[a-zA-Z0-9\s\-_\.]+$/,
      'Project name can only contain letters, numbers, spaces, hyphens, underscores, and dots',
    ),
  description: yup
    .string()
    .required('Description is required')
    .min(10, 'Description must be at least 10 characters')
    .max(150, 'Description must not exceed 150 characters'),
  tokenName: yup
    .string()
    .required('Token name is required')
    .min(2, 'Token name must be at least 2 characters')
    .max(20, 'Token name must not exceed 20 characters')
    .matches(
      /^[A-Z0-9_]+$/,
      'Token name must be uppercase letters, numbers, and underscores only',
    ),
  validateType: yup
    .string()
    .oneOf(['specific', 'all'], 'Invalid validation type')
    .required('Validation type is required'),
  validationStrategy: yup
    .string()
    .oneOf(
      ['simple', 'quorum', 'absolute', 'relative'],
      'Invalid validation strategy',
    )
    .required('Validation strategy is required'),
  validationPeriodDays: yup
    .number()
    .when('validateType', {
      is: 'all',
      then: (schema) => schema.required('Validation period is required'),
      otherwise: (schema) => schema.notRequired(),
    })
    .min(0, 'Validation period cannot be negative')
    .integer('Validation period must be a whole number')
    .max(365, 'Validation period must not exceed 365 days'),
  submitterType: yup
    .string()
    .oneOf(['everyone', 'restricted'], 'Invalid submitter type')
    .required('Submitter type is required'),
  defaultHourlyPay: yup
    .number()
    .min(0, 'Hourly pay cannot be negative')
    .max(10000, 'Hourly pay cannot exceed 10,000')
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === '' ? null : value;
    }),
  projectOwner: yup
    .string()
    .required('Project owner is required')
    .matches(
      /^(0x[a-fA-F0-9]{40}|.+\.eth)$/,
      'Must be a valid Ethereum address (0x...) or ENS domain (.eth)',
    ),
  members: yup
    .array()
    .of(memberSchema)
    .optional()
    .test(
      'unique-members',
      'Member addresses must be unique',
      (members = []) => {
        const seen = new Set<string>();
        for (const member of members) {
          const normalized = member?.address?.trim().toLowerCase();
          if (!normalized) {
            continue;
          }
          if (seen.has(normalized)) {
            return false;
          }
          seen.add(normalized);
        }
        return true;
      },
    ),
  otherLinks: yup.array().of(otherLinkSchema).optional(),
};

export const createProjectSchema = yup.object().shape({
  logo: yup.string().url('Invalid logo URL').required('Logo is required'),
  ...sharedProjectShape,
});

export const editProjectSchema = yup.object().shape({
  logo: yup.string().url('Invalid logo URL').nullable(),
  ...sharedProjectShape,
});

export type CreateProjectFormSchema = yup.InferType<typeof createProjectSchema>;
export type EditProjectFormSchema = yup.InferType<typeof editProjectSchema>;
