import { db } from '@/lib/db';
import { stringIdToBytes32 } from '../utils/id';
import type { Hex } from 'viem';

export async function ensureProjectBytes32(projectId: string, current?: string | null): Promise<Hex> {
  if (current) {
    return current as Hex;
  }
  const computed = stringIdToBytes32(projectId);
  await db.project.update({
    where: { id: projectId },
    data: { projectIdBytes32: computed },
  });
  return computed;
}

export async function ensureContributionBytes32(contributionId: string, current?: string | null): Promise<Hex> {
  if (current) {
    return current as Hex;
  }
  const computed = stringIdToBytes32(contributionId);
  await db.contribution.update({
    where: { id: contributionId },
    data: { contributionIdBytes32: computed },
  });
  return computed;
}
