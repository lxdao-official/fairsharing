export type ValidationStrategy = 'simple' | 'quorum' | 'absolute' | 'relative';
export type ValidateType = 'specific' | 'all';
export type SubmitterType = 'everyone' | 'restricted';

export type MemberRoleType = 'ADMIN' | 'VALIDATOR' | 'CONTRIBUTOR';

export type ProjectLinkType =
  | 'twitter'
  | 'telegram'
  | 'website'
  | 'github'
  | 'discord'
  | 'custom';

export interface ProjectMemberInput {
  address: string;
  isValidator: boolean;
  isContributor: boolean;
  isAdmin: boolean;
}

export interface ProjectLinkInput {
  type: ProjectLinkType;
  url: string;
}

interface ProjectFormBase {
  logo: string | null;
  projectName: string;
  description: string;
  tokenName: string;
  validateType: ValidateType;
  validationStrategy: ValidationStrategy;
  validationPeriodDays: number;
  submitterType: SubmitterType;
  defaultHourlyPay: number | null;
  projectOwner: string;
  members?: ProjectMemberInput[];
  otherLinks?: ProjectLinkInput[];
}

export type CreateProjectFormData = ProjectFormBase & {
  logo: string;
};

export type EditProjectFormData = ProjectFormBase & {
  projectId: string;
  projectKey: string;
};

export interface ProjectMemberDetails {
  id: string;
  role: MemberRoleType[];
  user: {
    id: string;
    walletAddress: string;
    ensName?: string | null;
    name?: string | null;
    avatar?: string | null;
  };
  deletedAt?: Date | null;
}

export interface ProjectOwnerDetails {
  id: string;
  walletAddress: string;
  ensName?: string | null;
  name?: string | null;
  avatar?: string | null;
}

export interface ProjectDetails {
  id: string;
  key: string;
  onChainAddress?: string | null;
  name: string;
  description: string;
  logo?: string | null;
  tokenSymbol?: string | null;
  validateType: 'SPECIFIC_MEMBERS' | 'ALL_MEMBERS';
  approvalStrategy?: {
    strategy?: ValidationStrategy;
    periodDays?: number;
  } | null;
  submitStrategy: 'EVERYONE' | 'RESTRICTED';
  ownerId: string;
  owner: ProjectOwnerDetails;
  defaultHourRate?: number | null;
  links?: {
    otherLinks?: ProjectLinkInput[];
  } | null;
  members: ProjectMemberDetails[];
  _count: {
    contributions: number;
    members: number;
    followers: number;
  };
}
