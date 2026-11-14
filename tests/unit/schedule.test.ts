import { describe, expect, it } from "vitest";
import type { ScheduleEntry } from "../../src/convex/api";
import {
  formatEventWindowLabel,
  formatScheduleDate,
  formatScheduleTime,
  groupScheduleEntriesByDay,
  scheduleDateKey,
  scheduleDayChapter,
  assignScheduleOverlapColumns,
  buildScheduleDayOverlapPlacements,
  formatScheduleEntryTime,
  scheduleDayHasOverlappingEntries,
  scheduleDayNumeral,
  scheduleEntryIsMilestone,
  scheduleEntrySlotCount,
  scheduleEntryOverlapGridFullWidth,
  scheduleEntrySpansOverlapGridFullWidth,
  scheduleEntryWindowsOverlap,
  resolveScheduleDisplayCategory,
  scheduleSlotCategoryClass,
} from "../../src/lib/schedule";

const overnightActivity: ScheduleEntry = {
  id: "overnight",
  title: "Overnight activity",
  startsAt: Date.parse("2026-11-14T23:30:00-06:00"),
  endsAt: Date.parse("2026-11-15T01:00:00-06:00"),
  category: "event",
};

describe("landing schedule display", () => {
  it("numbers event days with roman numerals and chapter names", () => {
    expect(scheduleDayNumeral(1)).toBe("I");
    expect(scheduleDayNumeral(2)).toBe("II");
    expect(scheduleDayNumeral(11)).toBe("11");
    expect(scheduleDayChapter(1)).toBe("One");
    expect(scheduleDayChapter(2)).toBe("Two");
    expect(scheduleDayChapter(8)).toBe("8");
  });

  it("groups spanning activities under every event-local calendar day", () => {
    const days = groupScheduleEntriesByDay([overnightActivity]);
    expect(days.map((day) => day.date)).toEqual(["2026-11-14", "2026-11-15"]);
    expect(days.map((day) => day.entries.map((entry) => entry.id))).toEqual([
      ["overnight"],
      ["overnight"],
    ]);
  });

  it("ignores an inverted event window when grouping empty days", () => {
    expect(
      groupScheduleEntriesByDay(
        [],
        Date.parse("2026-11-15T18:00:00-06:00"),
        Date.parse("2026-11-14T09:00:00-06:00"),
      ),
    ).toEqual([]);
  });

  it("keeps configured event days visible when no activities are published", () => {
    const days = groupScheduleEntriesByDay(
      [],
      Date.parse("2026-11-14T09:00:00-06:00"),
      Date.parse("2026-11-15T18:00:00-06:00"),
    );
    expect(days.map((day) => day.date)).toEqual(["2026-11-14", "2026-11-15"]);
    expect(days.every((day) => day.entries.length === 0)).toBe(true);
  });

  it("uses the event timezone for dates and times", () => {
    const timestamp = Date.parse("2026-11-15T05:30:00Z");
    expect(scheduleDateKey(timestamp)).toBe("2026-11-14");
    expect(formatScheduleDate("2026-11-14")).toBe("Saturday, November 14");
    expect(formatScheduleDate("2026-11-14", true)).toBe("Saturday, November 14, 2026");
    expect(formatScheduleTime(timestamp)).toBe("11:30 PM");
  });

  it("does not add the following date when an activity ends at midnight", () => {
    const endsAtMidnight: ScheduleEntry = {
      ...overnightActivity,
      endsAt: Date.parse("2026-11-15T00:00:00-06:00"),
    };
    expect(groupScheduleEntriesByDay([endsAtMidnight]).map((day) => day.date)).toEqual([
      "2026-11-14",
    ]);
  });

  it("treats touching windows as non-overlapping and overlapping windows as overlapping", () => {
    const nineToEleven = {
      startsAt: Date.parse("2026-11-14T09:00:00-06:00"),
      endsAt: Date.parse("2026-11-14T11:00:00-06:00"),
    };
    const elevenToNoon = {
      startsAt: Date.parse("2026-11-14T11:00:00-06:00"),
      endsAt: Date.parse("2026-11-14T12:00:00-06:00"),
    };
    const noonToLunch = {
      startsAt: Date.parse("2026-11-14T12:00:00-06:00"),
      endsAt: Date.parse("2026-11-14T13:30:00-06:00"),
    };
    const noonToEnd = {
      startsAt: Date.parse("2026-11-14T12:00:00-06:00"),
      endsAt: Date.parse("2026-11-15T18:00:00-06:00"),
    };

    expect(scheduleEntryWindowsOverlap(nineToEleven, elevenToNoon)).toBe(false);
    expect(scheduleDayHasOverlappingEntries([nineToEleven, elevenToNoon, noonToLunch])).toBe(false);
    expect(scheduleEntryWindowsOverlap(noonToLunch, noonToEnd)).toBe(true);
    expect(scheduleDayHasOverlappingEntries([nineToEleven, elevenToNoon, noonToLunch, noonToEnd])).toBe(
      true,
    );
  });

  it("counts fixed time slots from event duration", () => {
    const hour = {
      startsAt: Date.parse("2026-11-14T12:00:00-06:00"),
      endsAt: Date.parse("2026-11-14T13:00:00-06:00"),
    };
    const lunch = {
      startsAt: Date.parse("2026-11-14T12:00:00-06:00"),
      endsAt: Date.parse("2026-11-14T13:30:00-06:00"),
    };
    expect(scheduleEntrySlotCount(hour)).toBe(4);
    expect(scheduleEntrySlotCount(lunch)).toBe(6);
    expect(scheduleEntrySlotCount(lunch)).toBeGreaterThan(scheduleEntrySlotCount(hour));
  });

  it("resolves display categories for color coding", () => {
    expect(
      resolveScheduleDisplayCategory({ title: "Check-in", category: "event" }),
    ).toBe("check_in");
    expect(
      resolveScheduleDisplayCategory({ title: "Quiet Time", category: "quiet_time" }),
    ).toBe("check_in");
    expect(
      resolveScheduleDisplayCategory({ title: "Hacking Starts", category: "event" }),
    ).toBe("milestone");
    expect(
      resolveScheduleDisplayCategory({ title: "Lunch", category: "meal" }),
    ).toBe("meal");
    expect(
      scheduleSlotCategoryClass({ title: "Check-in", category: "check_in" }),
    ).toBe("weekend-slot--cat-check-in");
  });

  it("treats hacking and Devpost markers as single-time milestones", () => {
    const hackingEnds = {
      title: "Hacking Ends",
      startsAt: Date.parse("2026-11-15T12:00:00-06:00"),
      endsAt: Date.parse("2026-11-15T12:15:00-06:00"),
    };
    const workshop = {
      title: "Adobe Workshop",
      startsAt: Date.parse("2026-11-14T15:00:00-06:00"),
      endsAt: Date.parse("2026-11-14T15:45:00-06:00"),
    };

    expect(scheduleEntryIsMilestone({ ...hackingEnds, title: "Hacking Starts" })).toBe(true);
    expect(scheduleEntryIsMilestone(hackingEnds)).toBe(true);
    expect(scheduleEntryIsMilestone({ ...hackingEnds, title: "Devpost Deadline" })).toBe(true);
    expect(scheduleEntryIsMilestone(workshop)).toBe(false);
    expect(formatScheduleEntryTime(hackingEnds)).toBe("12:00 PM");
    expect(formatScheduleEntryTime(workshop)).toBe("3:00 PM – 3:45 PM");
  });

  it("places overlapping activities on separate tracks with time-aligned grid rows", () => {
    const lunch = {
      id: "lunch",
      startsAt: Date.parse("2026-11-14T12:00:00-06:00"),
      endsAt: Date.parse("2026-11-14T13:30:00-06:00"),
    };
    const mlh = {
      id: "mlh",
      startsAt: Date.parse("2026-11-14T13:00:00-06:00"),
      endsAt: Date.parse("2026-11-14T14:00:00-06:00"),
    };
  const columns = assignScheduleOverlapColumns([lunch, mlh]);
    expect(columns.get(lunch)).toBe(0);
    expect(columns.get(mlh)).toBe(1);

    const layout = buildScheduleDayOverlapPlacements([lunch, mlh]);
    expect(layout).not.toBeNull();
    const lunchPlacement = layout?.placements.find((row) => row.entry === lunch);
    const mlhPlacement = layout?.placements.find((row) => row.entry === mlh);
    expect(lunchPlacement?.gridRowStart).toBeLessThan(mlhPlacement?.gridRowStart ?? 0);
    expect(mlhPlacement?.gridRowStart).toBeGreaterThan(lunchPlacement?.gridRowStart ?? 0);
    expect(mlhPlacement?.gridRowStart).toBeLessThan(lunchPlacement?.gridRowEnd ?? 0);
  });

  it("spans Hacking Ends across both columns but keeps Hacking Starts in one column", () => {
    const hackingStarts = {
      id: "hacking-starts",
      title: "Hacking Starts",
      startsAt: Date.parse("2026-11-14T12:00:00-06:00"),
      endsAt: Date.parse("2026-11-14T12:15:00-06:00"),
    };
    const hackingEnds = {
      id: "hacking-ends",
      title: "Hacking Ends",
      startsAt: Date.parse("2026-11-15T12:00:00-06:00"),
      endsAt: Date.parse("2026-11-15T12:15:00-06:00"),
    };
    const lunch = {
      id: "lunch",
      startsAt: Date.parse("2026-11-14T12:00:00-06:00"),
      endsAt: Date.parse("2026-11-14T13:00:00-06:00"),
    };

    expect(scheduleEntrySpansOverlapGridFullWidth(hackingStarts)).toBe(false);
    expect(scheduleEntrySpansOverlapGridFullWidth(hackingEnds)).toBe(true);
    expect(
      scheduleEntrySpansOverlapGridFullWidth({
        title: "Hacking Ends (main stage)",
        startsAt: hackingEnds.startsAt,
        endsAt: hackingEnds.endsAt,
      }),
    ).toBe(true);

    const dayOne = buildScheduleDayOverlapPlacements([hackingStarts, lunch]);
    const startsPlacement = dayOne?.placements.find((row) => row.entry === hackingStarts);
    expect(startsPlacement?.fullWidth).toBe(false);
    expect(startsPlacement?.column).toBe(0);

    const lunchDayTwo = {
      ...lunch,
      startsAt: Date.parse("2026-11-15T12:00:00-06:00"),
      endsAt: Date.parse("2026-11-15T13:00:00-06:00"),
    };
    const dayTwo = buildScheduleDayOverlapPlacements([hackingEnds, lunchDayTwo]);
    const endsPlacement = dayTwo?.placements.find((row) => row.entry === hackingEnds);
    const lunchPlacement = dayTwo?.placements.find((row) => row.entry === lunchDayTwo);
    expect(endsPlacement?.fullWidth).toBe(false);
    expect(endsPlacement?.column).toBe(0);
    expect(lunchPlacement?.column).toBe(1);
    expect(scheduleEntryOverlapGridFullWidth(hackingEnds, [hackingEnds])).toBe(true);
    expect(scheduleEntryOverlapGridFullWidth(hackingEnds, [hackingEnds, lunchDayTwo])).toBe(
      false,
    );
  });

  it("keeps non-overlapping activities full width on overlap days", () => {
    const checkIn = {
      id: "check-in",
      startsAt: Date.parse("2026-11-14T09:00:00-06:00"),
      endsAt: Date.parse("2026-11-14T10:00:00-06:00"),
    };
    const lunch = {
      id: "lunch",
      startsAt: Date.parse("2026-11-14T12:00:00-06:00"),
      endsAt: Date.parse("2026-11-14T13:30:00-06:00"),
    };
    const mlh = {
      id: "mlh",
      startsAt: Date.parse("2026-11-14T13:00:00-06:00"),
      endsAt: Date.parse("2026-11-14T14:00:00-06:00"),
    };

    const layout = buildScheduleDayOverlapPlacements([checkIn, lunch, mlh]);
    const checkInPlacement = layout?.placements.find((row) => row.entry === checkIn);
    const lunchPlacement = layout?.placements.find((row) => row.entry === lunch);
    expect(checkInPlacement?.fullWidth).toBe(true);
    expect(lunchPlacement?.fullWidth).toBe(false);
  });

  it("formats the event window in Central Time", () => {
    expect(
      formatEventWindowLabel(
        Date.parse("2026-11-14T09:00:00-06:00"),
        Date.parse("2026-11-15T18:00:00-06:00"),
      ),
    ).toBe("November 14–15, 2026 · UT Arlington");
    expect(
      formatEventWindowLabel(
        Date.parse("2026-11-14T09:00:00-06:00"),
        Date.parse("2026-11-14T18:00:00-06:00"),
      ),
    ).toBe("November 14, 2026 · UT Arlington");
    expect(
      formatEventWindowLabel(
        Date.parse("2026-10-31T09:00:00-05:00"),
        Date.parse("2026-11-01T18:00:00-05:00"),
      ),
    ).toBe("October 31 – November 1, 2026 · UT Arlington");
  });
});
