export interface CreateProjectFormData {
  // Basic Information
  logo: string;
  projectName: string;
  description: string;
  tokenName: string;

  // Validation Settings
  validateType: 'specific' | 'all';
  validationStrategy: string;
  validationPeriodDays: number;

  // Submission Settings
  submitterType: 'everyone' | 'restricted';
  defaultHourlyPay: number;

  // Team Management
  projectOwner: string;
  members?: {
    address: string;
    role: string;
    hourlyPay?: number;
  }[];

  // Other Links (Optional)
  otherLinks?: {
    name: string;
    url: string;
  }[];
}

export type ValidationStrategy = 'simple' | 'quorum' | 'absolute' | 'relative';
export type ValidateType = 'specific' | 'all';
export type SubmitterType = 'everyone' | 'restricted';
