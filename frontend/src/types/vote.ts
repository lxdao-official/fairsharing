export const VOTE_CHOICES = ['PASS', 'FAIL', 'SKIP'] as const;

export type VoteChoice = (typeof VOTE_CHOICES)[number];

export const VOTE_CHOICE_VALUE_MAP: Record<VoteChoice, number> = {
  FAIL: 0,
  PASS: 1,
  SKIP: 2,
};

export const getVoteChoiceValue = (choice: VoteChoice) =>
  VOTE_CHOICE_VALUE_MAP[choice];
