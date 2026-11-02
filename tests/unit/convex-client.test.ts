import { describe, expect, it } from "vitest";
import { getConvexClient, normalizeConvexUrl } from "../../src/convex/client";
import { listPublicScheduleRef } from "../../src/convex/api";

describe("convex client", () => {
  it("trims and strips trailing slashes from Convex URLs", () => {
    expect(normalizeConvexUrl(" https://a.convex.cloud/// ")).toBe("https://a.convex.cloud");
    expect(normalizeConvexUrl("   ")).toBeUndefined();
    expect(normalizeConvexUrl(undefined)).toBeUndefined();
  });

  it("does not create a client when VITE_CONVEX_URL is unset", () => {
    expect(getConvexClient()).toBeNull();
  });

  it("points the public schedule query at the shared Convex function", () => {
    const key = Object.getOwnPropertySymbols(listPublicScheduleRef)[0];
    expect(key).toBeDefined();
    expect(Reflect.get(listPublicScheduleRef, key as symbol)).toBe(
      "profile/schedule:listPublicSchedule",
    );
  });
});
