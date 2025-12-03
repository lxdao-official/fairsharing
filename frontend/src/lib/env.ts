import { z } from 'zod';

/**
 * Server-side environment variables schema
 * These are only available on the server and should never be exposed to the client
 */
const serverEnvSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid database connection string'),

  // Authentication
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters for security'),

  // File Upload (Cloudflare R2)
  CLOUDFLARE_R2_ENDPOINT: z.string().url().optional(),
  CLOUDFLARE_R2_ACCESS_KEY_ID: z.string().optional(),
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: z.string().optional(),

  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

/**
 * Client-side environment variables schema
 * These are safe to expose to the client (prefixed with NEXT_PUBLIC_)
 */
const clientEnvSchema = z.object({
  // Web3 Configuration
  NEXT_PUBLIC_CHAIN_ID: z.string().default('31337'),
  NEXT_PUBLIC_RPC_URL: z.string().url().default('http://127.0.0.1:8545'),
  NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: z.string().optional(),

  // Contract Addresses
  NEXT_PUBLIC_PROJECT_FACTORY_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  NEXT_PUBLIC_VALIDATION_STRATEGY_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),

  // Vote Domain Configuration
  NEXT_PUBLIC_VOTE_DOMAIN_NAME: z.string().default('Fairsharing Vote'),
  NEXT_PUBLIC_VOTE_DOMAIN_VERSION: z.string().default('1'),
  NEXT_PUBLIC_VOTE_CONTRACT_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/).default('0x0000000000000000000000000000000000000000'),
});

/**
 * Validate and parse server environment variables
 * Only call this on the server side!
 */
export function validateServerEnv() {
  if (typeof window !== 'undefined') {
    throw new Error('validateServerEnv() should only be called on the server');
  }

  try {
    return serverEnvSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .map(err => `  - ${err.path.join('.')}: ${err.message}`)
        .join('\n');

      throw new Error(
        `❌ Invalid server environment variables:\n${missingVars}\n\nPlease check your .env file.`
      );
    }
    throw error;
  }
}

/**
 * Validate and parse client environment variables
 * Safe to call on both client and server
 */
export function validateClientEnv() {
  try {
    return clientEnvSchema.parse({
      NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID,
      NEXT_PUBLIC_RPC_URL: process.env.NEXT_PUBLIC_RPC_URL,
      NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
      NEXT_PUBLIC_PROJECT_FACTORY_ADDRESS: process.env.NEXT_PUBLIC_PROJECT_FACTORY_ADDRESS,
      NEXT_PUBLIC_VALIDATION_STRATEGY_ADDRESS: process.env.NEXT_PUBLIC_VALIDATION_STRATEGY_ADDRESS,
      NEXT_PUBLIC_VOTE_DOMAIN_NAME: process.env.NEXT_PUBLIC_VOTE_DOMAIN_NAME,
      NEXT_PUBLIC_VOTE_DOMAIN_VERSION: process.env.NEXT_PUBLIC_VOTE_DOMAIN_VERSION,
      NEXT_PUBLIC_VOTE_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_VOTE_CONTRACT_ADDRESS,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const invalidVars = error.errors
        .map(err => `  - ${err.path.join('.')}: ${err.message}`)
        .join('\n');

      console.warn(
        `⚠️ Invalid client environment variables:\n${invalidVars}\n\nUsing default values where possible.`
      );

      // In client validation, we're more lenient and return defaults
      return clientEnvSchema.parse({});
    }
    throw error;
  }
}

/**
 * Type-safe environment variables for server-side code
 * Usage: import { serverEnv } from '@/lib/env'
 */
export const serverEnv = typeof window === 'undefined' ? validateServerEnv() : ({} as z.infer<typeof serverEnvSchema>);

/**
 * Type-safe environment variables for client-side code
 * Usage: import { clientEnv } from '@/lib/env'
 */
export const clientEnv = validateClientEnv();

// Type exports for use in other files
export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;
