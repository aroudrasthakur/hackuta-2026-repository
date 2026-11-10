import { describe, expect, it } from "vitest";
import type { ScheduleEntry } from "../../src/convex/api";
import {
  formatEventWindowLabel,
  formatScheduleDate,
  formatScheduleTime,
  groupScheduleEntriesByDay,
  scheduleDateKey,
  scheduleDayChapter,
  scheduleDayNumeral,
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
