import { createTRPCReact } from '@trpc/react-query';
import { type inferRouterInputs, type inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '@/server/routers';

export const trpc = createTRPCReact<AppRouter>();
export const api = trpc;

export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
