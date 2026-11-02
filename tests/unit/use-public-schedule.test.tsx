import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HACKATHON_SCHEDULE } from "../../src/constants/hackathon";

const useQuery = vi.fn();
const getConvexClient = vi.fn();

vi.mock("convex/react", () => ({
  useQuery: (...args: unknown[]) => useQuery(...args),
}));

vi.mock("../../src/convex/client", () => ({
  getConvexClient: () => getConvexClient(),
}));

describe("usePublicSchedule", () => {
  beforeEach(() => {
    useQuery.mockReset();
    getConvexClient.mockReset();
  });

  it("returns the fallback weekend when Convex is not configured", async () => {
    getConvexClient.mockReturnValue(null);
    useQuery.mockReturnValue(undefined);
    const { usePublicSchedule, FALLBACK_PUBLIC_SCHEDULE } = await import(
      "../../src/hooks/usePublicSchedule"
    );
    const { result } = renderHook(() => usePublicSchedule());
    expect(result.current).toEqual({ loading: false, data: FALLBACK_PUBLIC_SCHEDULE });
    expect(useQuery).toHaveBeenCalledWith(expect.anything(), "skip");
  });

  it("keeps the fallback window while the live query is loading", async () => {
    getConvexClient.mockReturnValue({});
    useQuery.mockReturnValue(undefined);
    const { usePublicSchedule, FALLBACK_PUBLIC_SCHEDULE } = await import(
      "../../src/hooks/usePublicSchedule"
    );
    const { result } = renderHook(() => usePublicSchedule());
    expect(result.current).toEqual({ loading: true, data: FALLBACK_PUBLIC_SCHEDULE });
    expect(useQuery).toHaveBeenCalledWith(expect.anything(), {});
  });

  it("returns the live schedule once Convex responds", async () => {
    const live = {
      eventStartsAt: HACKATHON_SCHEDULE.startsAt,
      eventEndsAt: HACKATHON_SCHEDULE.endsAt,
      entries: [
        {
          id: "check-in",
          title: "Check-in",
          startsAt: HACKATHON_SCHEDULE.startsAt,
          endsAt: HACKATHON_SCHEDULE.startsAt + 60 * 60 * 1000,
          location: "SEIR lobby",
          category: "event",
        },
      ],
    };
    getConvexClient.mockReturnValue({});
    useQuery.mockReturnValue(live);
    const { usePublicSchedule } = await import("../../src/hooks/usePublicSchedule");
    const { result } = renderHook(() => usePublicSchedule());
    expect(result.current).toEqual({ loading: false, data: live });
  });
});
