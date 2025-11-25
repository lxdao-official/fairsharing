import * as Yup from 'yup';

// Contribution form validation schema
export const contributionSchema = Yup.object({
  content: Yup.string()
    .required('Contribution content is required')
    .min(10, 'Content must be at least 10 characters')
    .max(2000, 'Content cannot exceed 2000 characters'),
  
  hours: Yup.number()
    .typeError('Hours must be a number')
    .min(0, 'Hours cannot be negative')
    .max(1000, 'Hours cannot exceed 1000')
    .optional(),
  
  startDate: Yup.date()
    .optional(),
  
  endDate: Yup.date()
    .optional()
    .when('startDate', (startDate, schema) => {
      if (startDate) {
        return schema.min(startDate, 'End date must be after start date');
      }
      return schema;
    }),
  
  tags: Yup.array()
    .of(Yup.string().required())
    .max(10, 'Cannot have more than 10 tags')
    .optional(),
  
  contributors: Yup.array()
    .of(
      Yup.object({
        userId: Yup.string()
          .required('User ID is required'),
        hours: Yup.number()
          .min(0, 'Hours cannot be negative')
          .max(1000, 'Hours cannot exceed 1000')
          .optional(),
        points: Yup.number()
          .min(0, 'Points cannot be negative')
          .max(10000, 'Points cannot exceed 10000')
          .optional(),
      })
    )
    .min(1, 'At least one contributor is required')
    .required('Contributors are required'),
});

export type ContributionFormData = Yup.InferType<typeof contributionSchema>;

// Contribution update validation schema (similar to create but with ID)
export const updateContributionSchema = contributionSchema.shape({
  id: Yup.string()
    .required('Contribution ID is required'),
});

export type UpdateContributionFormData = Yup.InferType<typeof updateContributionSchema>;

// Contribution filter validation schema
export const contributionFilterSchema = Yup.object({
  projectId: Yup.string()
    .required('Project ID is required'),
  
  status: Yup.string()
    .oneOf(['VALIDATING', 'PASSED', 'FAILED', 'ON_CHAIN'], 'Invalid status')
    .optional(),
  
  contributorId: Yup.string()
    .optional(),
  
  search: Yup.string()
    .max(100, 'Search term cannot exceed 100 characters')
    .optional(),
  
  page: Yup.number()
    .integer('Page must be an integer')
    .min(1, 'Page must be at least 1')
    .default(1),
  
  limit: Yup.number()
    .integer('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(50, 'Limit cannot exceed 50')
    .default(20),
});

export type ContributionFilterData = Yup.InferType<typeof contributionFilterSchema>;