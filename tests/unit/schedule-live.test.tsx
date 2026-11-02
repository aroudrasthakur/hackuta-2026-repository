import { fireEvent, render, screen } from "@testing-library/react";
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

async function renderSchedule() {
  const { Schedule } = await import("../../src/components/Schedule");
  return render(<Schedule />);
}

describe("Schedule live Convex entries", () => {
  beforeEach(() => {
    useQuery.mockReset();
    getConvexClient.mockReset();
    getConvexClient.mockReturnValue({});
  });

  it("shows a loading status while the Convex query is in flight", async () => {
    useQuery.mockReturnValue(undefined);
    await renderSchedule();
    expect(screen.getByRole("status")).toHaveTextContent("Loading schedule…");
  });

  it("renders active schedule rows from Convex", async () => {
    useQuery.mockReturnValue({
      eventStartsAt: HACKATHON_SCHEDULE.startsAt,
      eventEndsAt: HACKATHON_SCHEDULE.endsAt,
      entries: [
        {
          id: "check-in",
          title: "Check-in",
          description: "Pick up your badge at the check-in desk.",
          startsAt: HACKATHON_SCHEDULE.startsAt,
          endsAt: HACKATHON_SCHEDULE.startsAt + 60 * 60 * 1000,
          location: "SEIR lobby",
          category: "event",
        },
      ],
    });
    await renderSchedule();
    const panel = screen.getByRole("tabpanel", { hidden: false });
    expect(panel).toHaveTextContent("Check-in");
    expect(panel).toHaveTextContent("SEIR lobby");
    expect(panel).toHaveTextContent("9:00 AM – 10:00 AM");
    expect(panel).not.toHaveTextContent("Schedule coming soon!");
  });

  it("still switches day tabs from the live event window", async () => {
    useQuery.mockReturnValue({
      eventStartsAt: HACKATHON_SCHEDULE.startsAt,
      eventEndsAt: HACKATHON_SCHEDULE.endsAt,
      entries: [
        {
          id: "check-in",
          title: "Check-in",
          startsAt: HACKATHON_SCHEDULE.startsAt,
          endsAt: HACKATHON_SCHEDULE.startsAt + 60 * 60 * 1000,
          category: "event",
        },
      ],
    });
    await renderSchedule();
    const dayTwo = screen.getByRole("tab", { name: /Sunday, November 15/i });
    fireEvent.click(dayTwo);
    expect(dayTwo).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel", { hidden: false })).toHaveTextContent("Schedule coming soon!");
  });
});
