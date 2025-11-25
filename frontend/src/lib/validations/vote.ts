import * as Yup from 'yup';

// Vote form validation schema
export const voteSchema = Yup.object({
  contributionId: Yup.string()
    .required('Contribution ID is required'),
  
  type: Yup.string()
    .oneOf(['PASS', 'FAIL', 'SKIP'], 'Invalid vote type')
    .required('Vote type is required'),
});

export type VoteFormData = Yup.InferType<typeof voteSchema>;

// Bulk vote validation schema (for voting on multiple contributions)
export const bulkVoteSchema = Yup.object({
  votes: Yup.array()
    .of(voteSchema)
    .min(1, 'At least one vote is required')
    .max(50, 'Cannot vote on more than 50 contributions at once')
    .required('Votes are required'),
});

export type BulkVoteFormData = Yup.InferType<typeof bulkVoteSchema>;

// Vote filter validation schema
export const voteFilterSchema = Yup.object({
  contributionId: Yup.string()
    .optional(),
  
  projectId: Yup.string()
    .optional(),
  
  voterId: Yup.string()
    .optional(),
  
  type: Yup.string()
    .oneOf(['PASS', 'FAIL', 'SKIP'], 'Invalid vote type')
    .optional(),
  
  page: Yup.number()
    .integer('Page must be an integer')
    .min(1, 'Page must be at least 1')
    .default(1),
  
  limit: Yup.number()
    .integer('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(20),
});

export type VoteFilterData = Yup.InferType<typeof voteFilterSchema>;

// Vote statistics validation schema
export const voteStatsSchema = Yup.object({
  contributionId: Yup.string()
    .required('Contribution ID is required'),
});

export type VoteStatsData = Yup.InferType<typeof voteStatsSchema>;