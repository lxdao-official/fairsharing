import { VoteType } from '@prisma/client';

export interface StrategyVoteRecord {
  type: VoteType;
  voterId: string;
}

export interface StrategyInput {
  eligibleVoters: number;
  votes: StrategyVoteRecord[];
  config?: Record<string, unknown> | null;
}

export interface StrategyResult {
  statusDetermined: boolean;
  shouldPass: boolean;
  shouldFail: boolean;
  meta: {
    passVotes: number;
    failVotes: number;
    skipVotes: number;
    totalVotes: number;
    eligibleVoters: number;
    threshold: number;
  };
}

const countVotes = (votes: StrategyVoteRecord[]) => {
  const initial = { passVotes: 0, failVotes: 0, skipVotes: 0 };

  return votes.reduce((acc, vote) => {
    switch (vote.type) {
      case VoteType.PASS:
        acc.passVotes += 1;
        break;
      case VoteType.FAIL:
        acc.failVotes += 1;
        break;
      case VoteType.SKIP:
        acc.skipVotes += 1;
        break;
      default:
        break;
    }

    return acc;
  }, initial);
};

const simpleStrategy = ({ eligibleVoters, votes }: StrategyInput): StrategyResult => {
  const { passVotes, failVotes, skipVotes } = countVotes(votes);
  const totalVotes = passVotes + failVotes + skipVotes;
  const threshold = eligibleVoters / 2;

  const shouldPass = passVotes > threshold;
  const shouldFail = failVotes > threshold;
  const statusDetermined = shouldPass || shouldFail;

  return {
    statusDetermined,
    shouldPass,
    shouldFail,
    meta: {
      passVotes,
      failVotes,
      skipVotes,
      totalVotes,
      eligibleVoters,
      threshold,
    },
  };
};

const strategies: Record<string, typeof simpleStrategy> = {
  simple: simpleStrategy,
};

export const evaluateVotingStrategy = (
  strategyKey: string,
  input: StrategyInput,
) => {
  const strategy = strategies[strategyKey] ?? simpleStrategy;
  return strategy(input);
};
