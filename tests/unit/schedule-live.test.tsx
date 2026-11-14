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
          category: "check_in",
        },
      ],
    });
    await renderSchedule();
    const panel = screen.getByRole("tabpanel", { hidden: false });
    expect(panel.querySelector(".weekend-slot--cat-check-in")).not.toBeNull();
    expect(panel).toHaveTextContent("Check-in");
    expect(panel).toHaveTextContent("SEIR lobby");
    expect(panel).toHaveTextContent("9:00 AM – 10:00 AM");
    expect(panel).not.toHaveTextContent("Schedule coming soon!");
    expect(panel.querySelector(".weekend-timeline--overlapping")).toBeNull();
  });

  it("uses a multi-column timeline class when same-day activities overlap", async () => {
    const startsAt = HACKATHON_SCHEDULE.startsAt;
    useQuery.mockReturnValue({
      eventStartsAt: startsAt,
      eventEndsAt: HACKATHON_SCHEDULE.endsAt,
      entries: [
        {
          id: "hacking",
          title: "Hacking",
          startsAt,
          endsAt: HACKATHON_SCHEDULE.endsAt,
          category: "event",
        },
        {
          id: "lunch",
          title: "Lunch",
          startsAt: startsAt + 3 * 60 * 60 * 1000,
          endsAt: startsAt + 4.5 * 60 * 60 * 1000,
          category: "meal",
        },
      ],
    });
    await renderSchedule();
    const panel = screen.getByRole("tabpanel", { hidden: false });
    expect(panel.querySelector(".weekend-timeline--overlapping")).not.toBeNull();
  });

  it("renders hacking and Devpost markers as filled milestone rows", async () => {
    const startsAt = HACKATHON_SCHEDULE.startsAt;
    useQuery.mockReturnValue({
      eventStartsAt: startsAt,
      eventEndsAt: HACKATHON_SCHEDULE.endsAt,
      entries: [
        {
          id: "hacking-starts",
          title: "Hacking Starts",
          startsAt,
          endsAt: startsAt + 15 * 60 * 1000,
          category: "event",
        },
        {
          id: "devpost",
          title: "Devpost Deadline",
          startsAt: startsAt + 14 * 60 * 60 * 1000,
          endsAt: startsAt + 14 * 60 * 60 * 1000 + 60 * 1000,
          category: "event",
        },
        {
          id: "hacking-ends",
          title: "Hacking Ends",
          startsAt: startsAt + 3 * 60 * 60 * 1000,
          endsAt: startsAt + 3 * 60 * 60 * 1000 + 15 * 60 * 1000,
          category: "event",
        },
      ],
    });
    await renderSchedule();
    const panel = screen.getByRole("tabpanel", { hidden: false });
    expect(panel.querySelectorAll(".weekend-slot--milestone")).toHaveLength(3);
    expect(panel).toHaveTextContent("Hacking Starts");
    expect(panel).toHaveTextContent("Hacking Ends");
    expect(panel).toHaveTextContent("Devpost Deadline");
    expect(panel).toHaveTextContent("9:00 AM");
    expect(panel).not.toHaveTextContent("9:00 AM – 9:15 AM");
    expect(panel).not.toHaveTextContent("12:00 PM – 12:15 PM");
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
