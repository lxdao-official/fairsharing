/**
 * EIP-712 Typed Data Definitions for FairSharing
 *
 * This file defines the structured data types for EIP-712 signatures.
 * EIP-712 provides type-safe, human-readable signatures that are easy to verify on-chain.
 */

import type { TypedDataDomain } from 'viem';

// ========================
// Domain Definition
// ========================

/**
 * EIP-712 Domain for FairSharing
 * This identifies the application and prevents cross-chain/cross-contract replay attacks
 */
export const FAIRSHARING_DOMAIN = {
  name: 'FairSharing',
  version: '1',
  // chainId will be added dynamically based on user's current chain
  // verifyingContract will be added when smart contract is deployed
} as const;

/**
 * Get domain with dynamic chainId
 */
export function getFairsharingDomain(chainId: number): TypedDataDomain {
  return {
    ...FAIRSHARING_DOMAIN,
    chainId,
    // TODO: Add verifyingContract address when smart contract is deployed
    // verifyingContract: '0x...' as `0x${string}`,
  };
}

// ========================
// Vote Types Definition
// ========================

/**
 * EIP-712 Type definitions for Vote
 */
export const VOTE_TYPES = {
  Vote: [
    { name: 'contributionId', type: 'string' },
    { name: 'projectId', type: 'string' },
    { name: 'voteType', type: 'uint8' },
    { name: 'voter', type: 'address' },
    { name: 'timestamp', type: 'uint256' },
    { name: 'nonce', type: 'bytes32' },
  ],
} as const;

/**
 * Vote type enum (matches Prisma VoteType)
 */
export enum VoteTypeEnum {
  PASS = 1,
  FAIL = 2,
  SKIP = 3,
}

/**
 * Convert string vote type to enum
 */
export function getVoteTypeEnum(voteType: 'PASS' | 'FAIL' | 'SKIP'): VoteTypeEnum {
  return VoteTypeEnum[voteType];
}

/**
 * Convert enum to string vote type
 */
export function getVoteTypeString(voteTypeEnum: VoteTypeEnum): 'PASS' | 'FAIL' | 'SKIP' {
  switch (voteTypeEnum) {
    case VoteTypeEnum.PASS:
      return 'PASS';
    case VoteTypeEnum.FAIL:
      return 'FAIL';
    case VoteTypeEnum.SKIP:
      return 'SKIP';
    default:
      throw new Error(`Invalid vote type enum: ${voteTypeEnum}`);
  }
}

// ========================
// Vote Message Structure
// ========================

/**
 * Vote message structure for EIP-712 signing
 */
export interface VoteMessage {
  contributionId: string;
  projectId: string;
  voteType: VoteTypeEnum;
  voter: `0x${string}`;
  timestamp: bigint;
  nonce: `0x${string}`;
}

/**
 * Create vote message for signing
 */
export function createVoteMessage(params: {
  contributionId: string;
  projectId: string;
  voteType: 'PASS' | 'FAIL' | 'SKIP';
  voterAddress: `0x${string}`;
}): VoteMessage {
  // Generate cryptographically secure nonce
  const nonceBytes = new Uint8Array(32);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(nonceBytes);
  } else {
    // Fallback for environments without crypto.getRandomValues
    for (let i = 0; i < 32; i++) {
      nonceBytes[i] = Math.floor(Math.random() * 256);
    }
  }

  // Convert to hex string
  const nonce = `0x${Array.from(nonceBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')}` as `0x${string}`;

  return {
    contributionId: params.contributionId,
    projectId: params.projectId,
    voteType: getVoteTypeEnum(params.voteType),
    voter: params.voterAddress,
    timestamp: BigInt(Math.floor(Date.now() / 1000)), // Unix timestamp in seconds
    nonce,
  };
}

// ========================
// Signature Validation
// ========================

/**
 * Validate vote message fields
 * Note: No timestamp expiration check - votes may take extended time to collect
 */
export function validateVoteMessage(message: VoteMessage): { valid: boolean; error?: string } {
  // Check vote type
  if (![VoteTypeEnum.PASS, VoteTypeEnum.FAIL, VoteTypeEnum.SKIP].includes(message.voteType)) {
    return {
      valid: false,
      error: `Invalid vote type: ${message.voteType}`,
    };
  }

  // Check voter address format
  if (!message.voter.startsWith('0x') || message.voter.length !== 42) {
    return {
      valid: false,
      error: `Invalid voter address format: ${message.voter}`,
    };
  }

  // Check nonce format
  if (!message.nonce.startsWith('0x') || message.nonce.length !== 66) {
    return {
      valid: false,
      error: `Invalid nonce format: ${message.nonce}`,
    };
  }

  return { valid: true };
}

// ========================
// Type Exports for Backend
// ========================

/**
 * Signature data structure for database storage
 */
export interface VoteSignatureData {
  signature: `0x${string}`;
  signaturePayload: VoteMessage;
  chainId: number;
}
