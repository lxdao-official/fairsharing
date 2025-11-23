/**
 * EIP-712 Signature Verification
 *
 * Server-side signature verification for EIP-712 typed data signatures.
 * Uses viem for consistent API with frontend.
 */

import { verifyTypedData, type Address, type Hex } from 'viem';
import {
  VOTE_TYPES,
  getFairsharingDomain,
  validateVoteMessage,
  type VoteMessage,
} from './eip712';

// ========================
// Type Definitions
// ========================

/**
 * Signature verification result
 */
export interface SignatureVerificationResult {
  valid: boolean;
  error?: string;
  recoveredAddress?: Address;
}

/**
 * EIP-712 verification params
 */
export interface VerifyEIP712Params {
  signature: Hex;
  message: VoteMessage;
  expectedAddress: Address;
  chainId: number;
}

// ========================
// EIP-712 Verification
// ========================

/**
 * Verify EIP-712 typed data signature
 *
 * @param params - Verification parameters
 * @returns Verification result with recovered address
 *
 * @example
 * ```typescript
 * const result = await verifyEIP712Signature({
 *   signature: '0xabc...',
 *   message: {
 *     contributionId: 'clxxx...',
 *     projectId: 'clyyy...',
 *     voteType: 1,
 *     voter: '0x1234...',
 *     timestamp: 1737552600n,
 *     nonce: '0x...'
 *   },
 *   expectedAddress: '0x1234...',
 *   chainId: 1
 * });
 * ```
 */
export async function verifyEIP712Signature(
  params: VerifyEIP712Params,
): Promise<SignatureVerificationResult> {
  try {
    const { signature, message, expectedAddress, chainId } = params;

    // 1. Validate message fields
    const validation = validateVoteMessage(message);
    if (!validation.valid) {
      return {
        valid: false,
        error: validation.error,
      };
    }

    // 2. Get domain for this chain
    const domain = getFairsharingDomain(chainId);

    // 3. Verify signature using viem
    const isValid = await verifyTypedData({
      address: expectedAddress,
      domain,
      types: VOTE_TYPES,
      primaryType: 'Vote',
      message,
      signature,
    });

    if (!isValid) {
      return {
        valid: false,
        error: 'Signature verification failed: recovered address does not match expected address',
      };
    }

    return {
      valid: true,
      recoveredAddress: expectedAddress,
    };
  } catch (error) {
    console.error('[SignatureVerification] EIP-712 verification error:', error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown verification error',
    };
  }
}

// ========================
// Validation Helpers
// ========================

/**
 * Check if address is valid Ethereum address
 */
export function isValidAddress(address: string): address is Address {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Check if signature is valid hex string
 */
export function isValidSignature(signature: string): signature is Hex {
  // Ethereum signatures are 65 bytes = 130 hex chars + 0x prefix = 132 chars
  return /^0x[a-fA-F0-9]{130}$/.test(signature);
}

/**
 * Normalize address to lowercase
 */
export function normalizeAddress(address: string): Address {
  return address.toLowerCase() as Address;
}

// ========================
// Error Messages
// ========================

export const SIGNATURE_ERRORS = {
  INVALID_FORMAT: 'Invalid signature format',
  INVALID_ADDRESS: 'Invalid Ethereum address',
  SIGNATURE_EXPIRED: 'Signature has expired',
  VERIFICATION_FAILED: 'Signature verification failed',
  INVALID_VOTE_TYPE: 'Invalid vote type',
  INVALID_CHAIN_ID: 'Invalid chain ID',
  MISSING_FIELDS: 'Required signature fields are missing',
} as const;
