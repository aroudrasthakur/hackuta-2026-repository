/* eslint-disable */
/**
 * Minimal Convex server stubs for local tests when codegen is unavailable.
 * Run `npx convex codegen` to replace with generated output for deployment.
 */
import {
  actionGeneric,
  httpActionGeneric,
  internalActionGeneric,
  internalMutationGeneric,
  internalQueryGeneric,
  mutationGeneric,
  queryGeneric,
} from "convex/server";
import type { GenericMutationCtx, GenericQueryCtx } from "convex/server";

export const query = queryGeneric;
export const mutation = mutationGeneric;
export const action = actionGeneric;
export const httpAction = httpActionGeneric;
export const internalQuery = internalQueryGeneric;
export const internalMutation = internalMutationGeneric;
export const internalAction = internalActionGeneric;

export type QueryCtx = GenericQueryCtx<any>;

export type MutationCtx = GenericMutationCtx<any>;

export type ActionCtx = Record<string, never>;
