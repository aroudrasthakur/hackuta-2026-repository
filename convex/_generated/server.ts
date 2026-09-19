/* eslint-disable */
/**
 * Minimal Convex server stubs for local tests when codegen is unavailable.
 * Run `npx convex codegen` to replace with generated output for deployment.
 */
import {
  actionGeneric,
  internalActionGeneric,
  internalMutationGeneric,
  internalQueryGeneric,
  mutationGeneric,
  queryGeneric,
} from "convex/server";

export const query = queryGeneric;
export const mutation = mutationGeneric;
export const action = actionGeneric;
export const internalQuery = internalQueryGeneric;
export const internalMutation = internalMutationGeneric;
export const internalAction = internalActionGeneric;

export type QueryCtx = {
  db: {
    query: (table: string) => unknown;
    get: (id: unknown) => Promise<unknown>;
  };
};

export type MutationCtx = {
  db: {
    query: (table: string) => unknown;
    insert: (table: string, doc: unknown) => Promise<unknown>;
    patch: (id: unknown, doc: unknown) => Promise<void>;
    get: (id: unknown) => Promise<unknown>;
  };
};

export type ActionCtx = Record<string, never>;
