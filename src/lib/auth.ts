import jwt from 'jsonwebtoken';
import { ethers } from 'ethers';
import crypto from 'crypto';

// JWT related interfaces
export interface JWTPayload {
  userId: string;
  walletAddress: string;
  iat: number;
  exp: number;
}

export interface AuthSession {
  user: {
    id: string;
    walletAddress: string;
    ensName?: string | null;
    name?: string | null;
    avatar?: string | null;
  };
  token: string;
  expiresAt: number;
}

/**
 * Generate random nonce
 */
export function generateNonce(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Generate login signature message
 */
export function generateLoginMessage(address: string, nonce: string): string {
  return `Welcome to FairSharing!

Please sign this message to authenticate your wallet.

Wallet Address: ${address}
Nonce: ${nonce}

This signature will not trigger any blockchain transaction or cost gas fees.`;
}

/**
 * Verify wallet address signature
 */
export function verifySignature(
  message: string,
  signature: string,
  expectedAddress: string,
): boolean {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

/**
 * Generate JWT Token
 */
export function generateJWT(userId: string, walletAddress: string): string {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
    userId,
    walletAddress: walletAddress.toLowerCase(),
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '30d', // 30 days expiration
    issuer: 'fairsharing-dapp',
  });
}

/**
 * Verify JWT Token
 */
export function verifyJWT(token: string): JWTPayload | null {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is required');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

/**
 * Extract Bearer Token from Authorization header
 */
export function extractBearerToken(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}
