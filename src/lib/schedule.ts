import type { ScheduleEntry } from "../convex/api";

const HACKATHON_TIME_ZONE = "America/Chicago";
const ROMAN_NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
const DAY_CHAPTERS = ["One", "Two", "Three", "Four", "Five", "Six", "Seven"];

export type ScheduleDay = {
  date: string;
  entries: ScheduleEntry[];
};

export type ScheduleTimeWindow = Pick<ScheduleEntry, "startsAt" | "endsAt">;

export const SCHEDULE_OVERLAP_GRID_SLOT_MS = 15 * 60 * 1000;
const MILESTONE_TITLE = /hacking\s+starts|hacking\s+ends|devpost\s+deadline/i;
const CHECK_IN_TITLE = /^check[-\s]?in$/i;
const QUIET_TIME_TITLE = /^quiet\s+time$/i;

/** Normalized category slug for schedule color coding (`check_in`, `meal`, …). */
export function resolveScheduleDisplayCategory(
  entry: Pick<ScheduleEntry, "title" | "category">,
): string {
  const title = entry.title.trim();
  if (CHECK_IN_TITLE.test(title)) return "check_in";
  if (QUIET_TIME_TITLE.test(title)) return "check_in";
  if (MILESTONE_TITLE.test(title)) return "milestone";
  const normalized = entry.category
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  if (normalized === "quiet_time") return "check_in";
  return normalized || "event";
}

export function scheduleSlotCategoryClass(
  entry: Pick<ScheduleEntry, "title" | "category">,
  slotBlock = "weekend-slot",
) {
  const slug = resolveScheduleDisplayCategory(entry).replace(/_/g, "-");
  return `${slotBlock}--cat-${slug}`;
}

export function scheduleEntrySlotCount(
  entry: ScheduleTimeWindow,
  slotMs = SCHEDULE_OVERLAP_GRID_SLOT_MS,
) {
  return Math.max(1, Math.ceil((entry.endsAt - entry.startsAt) / slotMs));
}

export function scheduleEntryIsMilestone(
  entry: ScheduleTimeWindow & { title?: string },
) {
  return Boolean(entry.title && MILESTONE_TITLE.test(entry.title));
}

/** Milestones that may span the full overlap grid (not Hacking Starts). */
export function scheduleEntrySpansOverlapGridFullWidth(
  entry: ScheduleTimeWindow & { title?: string },
) {
  if (!scheduleEntryIsMilestone(entry)) return false;
  const title = entry.title?.trim() ?? "";
  return !/^hacking\s+starts$/i.test(title);
}

export function scheduleEntryOverlapGridFullWidth<T extends ScheduleTimeWindow>(
  entry: ScheduleTimeWindow & { title?: string },
  entries: readonly T[],
) {
  return (
    scheduleEntrySpansOverlapGridFullWidth(entry)
    && !scheduleEntryOverlapsAnother(entry, entries)
  );
}

export function formatScheduleEntryTime(entry: ScheduleTimeWindow & { title?: string }) {
  const start = formatScheduleTime(entry.startsAt);
  if (scheduleEntryIsMilestone(entry)) return start;
  return `${start} – ${formatScheduleTime(entry.endsAt)}`;
}

export type ScheduleOverlapPlacement<T extends ScheduleTimeWindow = ScheduleEntry> = {
  entry: T;
  column: 0 | 1;
  fullWidth: boolean;
  gridRowStart: number;
  gridRowEnd: number;
};

/** True when intervals share time (touching end/start is not overlap). */
export function scheduleEntryWindowsOverlap(left: ScheduleTimeWindow, right: ScheduleTimeWindow) {
  return left.startsAt < right.endsAt && left.endsAt > right.startsAt;
}

export function scheduleDayHasOverlappingEntries(entries: readonly ScheduleTimeWindow[]) {
  for (let index = 0; index < entries.length; index += 1) {
    const left = entries[index];
    if (!left) continue;
    for (let other = index + 1; other < entries.length; other += 1) {
      const right = entries[other];
      if (right && scheduleEntryWindowsOverlap(left, right)) return true;
    }
  }
  return false;
}

export function scheduleEntryOverlapsAnother<T extends ScheduleTimeWindow>(
  entry: T,
  entries: readonly T[],
) {
  return entries.some(
    (other) => other !== entry && scheduleEntryWindowsOverlap(entry, other),
  );
}

/** Picks a left or right track so concurrent activities sit side by side. */
export function assignScheduleOverlapColumns<T extends ScheduleTimeWindow>(
  entries: readonly T[],
): Map<T, 0 | 1> {
  const sorted = [...entries].sort(
    (left, right) => left.startsAt - right.startsAt || left.endsAt - right.endsAt,
  );
  const columnEnds: [number, number] = [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY];
  const assignment = new Map<T, 0 | 1>();

  for (const entry of sorted) {
    let column: 0 | 1 | null = null;
    for (const candidate of [0, 1] as const) {
      if (entry.startsAt >= columnEnds[candidate]) {
        column = candidate;
        break;
      }
    }
    if (column === null) {
      column = columnEnds[0] <= columnEnds[1] ? 0 : 1;
    }
    assignment.set(entry, column);
    columnEnds[column] = Math.max(columnEnds[column], entry.endsAt);
  }

  return assignment;
}

export function buildScheduleDayOverlapPlacements<T extends ScheduleTimeWindow>(
  entries: readonly T[],
  slotMs = SCHEDULE_OVERLAP_GRID_SLOT_MS,
): { placements: ScheduleOverlapPlacement<T>[]; gridRowCount: number } | null {
  if (!scheduleDayHasOverlappingEntries(entries)) return null;

  const origin = Math.min(...entries.map((entry) => entry.startsAt));
  const end = Math.max(...entries.map((entry) => entry.endsAt));
  const gridRowCount = Math.max(1, Math.ceil((end - origin) / slotMs));
  const columns = assignScheduleOverlapColumns(entries);

  const placements = entries.map((entry) => {
    const gridRowStart = Math.floor((entry.startsAt - origin) / slotMs) + 1;
    const gridRowEnd = Math.max(
      gridRowStart + 1,
      Math.ceil((entry.endsAt - origin) / slotMs) + 1,
    );
    const titled = entry as ScheduleTimeWindow & { title?: string };
    return {
      entry,
      column: columns.get(entry) ?? 0,
      fullWidth:
        scheduleEntryOverlapGridFullWidth(titled, entries)
        || (!scheduleEntryIsMilestone(titled) && !scheduleEntryOverlapsAnother(entry, entries)),
      gridRowStart,
      gridRowEnd,
    };
  });

  placements.sort(
    (left, right) =>
      left.gridRowStart - right.gridRowStart ||
      left.column - right.column ||
      left.entry.startsAt - right.entry.startsAt,
  );

  return { placements, gridRowCount };
}

export function scheduleDayNumeral(dayNumber: number) {
  return ROMAN_NUMERALS[dayNumber - 1] ?? String(dayNumber);
}

export function scheduleDayChapter(dayNumber: number) {
  return DAY_CHAPTERS[dayNumber - 1] ?? String(dayNumber);
}

export function scheduleDateKey(timestamp: number) {
  const parts = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: HACKATHON_TIME_ZONE,
  }).formatToParts(new Date(timestamp));
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  if (!year || !month || !day) throw new Error("Could not format schedule date.");
  return `${year}-${month}-${day}`;
}

function nextDate(date: string) {
  const next = new Date(`${date}T12:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return next.toISOString().slice(0, 10);
}

export function groupScheduleEntriesByDay(
  entries: ScheduleEntry[],
  eventStartsAt?: number,
  eventEndsAt?: number,
): ScheduleDay[] {
  const groups = new Map<string, ScheduleEntry[]>();

  if (
    eventStartsAt !== undefined &&
    eventEndsAt !== undefined &&
    eventEndsAt > eventStartsAt
  ) {
    const firstDate = scheduleDateKey(eventStartsAt);
    const lastDate = scheduleDateKey(eventEndsAt - 1);
    let date = firstDate;
    while (date <= lastDate) {
      groups.set(date, []);
      date = nextDate(date);
    }
  }

  for (const entry of entries) {
    const firstDate = scheduleDateKey(entry.startsAt);
    const lastDate = scheduleDateKey(Math.max(entry.startsAt, entry.endsAt - 1));
    let date = firstDate;
    while (date <= lastDate) {
      const group = groups.get(date) ?? [];
      group.push(entry);
      groups.set(date, group);
      date = nextDate(date);
    }
  }

  return [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, dayEntries]) => ({
      date,
      entries: dayEntries.sort((left, right) => left.startsAt - right.startsAt),
    }));
}

export function formatScheduleDate(date: string, includeYear = false) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    ...(includeYear ? { year: "numeric" as const } : {}),
    timeZone: HACKATHON_TIME_ZONE,
  }).format(new Date(`${date}T12:00:00Z`));
}

export function formatScheduleTime(timestamp: number) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: HACKATHON_TIME_ZONE,
  }).format(new Date(timestamp));
}

export function formatEventWindowLabel(startsAt: number, endsAt: number) {
  const startDate = scheduleDateKey(startsAt);
  const endDate = scheduleDateKey(Math.max(startsAt, endsAt - 1));
  const start = new Date(`${startDate}T12:00:00Z`);
  const end = new Date(`${endDate}T12:00:00Z`);
  const monthDay = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
  const startLabel = monthDay.format(start);
  const endLabel = monthDay.format(end);
  const year = end.getUTCFullYear();
  const range = startDate === endDate
    ? `${startLabel}, ${year}`
    : start.getUTCMonth() === end.getUTCMonth()
      ? `${startLabel}–${end.getUTCDate()}, ${year}`
      : `${startLabel} – ${endLabel}, ${year}`;
  return `${range} · UT Arlington`;
}
