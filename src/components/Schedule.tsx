import { useRef, useState, type KeyboardEvent } from "react";
import { OliveBranch } from "./art/OliveBranch";
import { ThemeArt } from "./art/ThemeArt";
import { getConvexClient } from "../convex/client";
import type { PublicSchedule } from "../convex/api";
import { FALLBACK_PUBLIC_SCHEDULE, usePublicSchedule } from "../hooks/usePublicSchedule";
import {
  formatEventWindowLabel,
  formatScheduleDate,
  formatScheduleTime,
  groupScheduleEntriesByDay,
  scheduleDateKey,
  scheduleDayChapter,
  scheduleDayNumeral,
} from "../lib/schedule";

function nearestDayIndex(days: Array<{ date: string }>) {
  const today = scheduleDateKey(Date.now());
  const todayAtNoon = Date.parse(`${today}T12:00:00Z`);
  return days.reduce((nearest, day, index) => {
    const nearestDay = days[nearest];
    if (!nearestDay) return index;
    const dayDistance = Math.abs(Date.parse(`${day.date}T12:00:00Z`) - todayAtNoon);
    const nearestDistance = Math.abs(Date.parse(`${nearestDay.date}T12:00:00Z`) - todayAtNoon);
    return dayDistance < nearestDistance ? index : nearest;
  }, 0);
}

function ScheduleTabButton({
  date,
  index,
  isSelected,
  tabRef,
  onSelect,
  onKeyDown,
}: {
  date: string;
  index: number;
  isSelected: boolean;
  tabRef: (node: HTMLButtonElement | null) => void;
  onSelect: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      ref={tabRef}
      type="button"
      role="tab"
      id={`schedule-tab-${index + 1}`}
      className="weekend-tab"
      aria-selected={isSelected}
      aria-controls={`schedule-panel-${index + 1}`}
      tabIndex={isSelected ? 0 : -1}
      onClick={onSelect}
      onKeyDown={onKeyDown}
    >
      <span className="weekend-tab-numeral" aria-hidden="true">
        {scheduleDayNumeral(index + 1)}
      </span>
      <span className="weekend-tab-label">
        Day {scheduleDayNumeral(index + 1)}
        <span className="weekend-tab-date">{formatScheduleDate(date)}</span>
      </span>
    </button>
  );
}

function ScheduleView({ data, loading }: { data: PublicSchedule; loading: boolean }) {
  const days = groupScheduleEntriesByDay(data.entries, data.eventStartsAt, data.eventEndsAt);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const selectedIndex = Math.max(
    0,
    days.findIndex((day) => day.date === selectedDate),
  );
  const activeIndex = days.some((day) => day.date === selectedDate)
    ? selectedIndex
    : days.length > 0
      ? nearestDayIndex(days)
      : -1;

  const moveFocus = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (days.length === 0) return;
    const next = {
      ArrowRight: activeIndex === days.length - 1 ? 0 : activeIndex + 1,
      ArrowDown: activeIndex === days.length - 1 ? 0 : activeIndex + 1,
      ArrowLeft: activeIndex === 0 ? days.length - 1 : activeIndex - 1,
      ArrowUp: activeIndex === 0 ? days.length - 1 : activeIndex - 1,
      Home: 0,
      End: days.length - 1,
    }[event.key];

    if (next === undefined) return;
    event.preventDefault();
    const day = days[next];
    if (!day) return;
    setSelectedDate(day.date);
    tabs.current[next]?.focus();
  };

  return (
    <section
      id="schedule"
      className="weekend-section relative isolate overflow-hidden"
      data-theme="clay"
      aria-labelledby="weekend-title"
    >
      <span className="weekend-meander" data-edge="top" aria-hidden="true" />

      <div className="section-inner weekend-inner relative">
        <div className="weekend-intro text-center">
          <h2 id="weekend-title" className="font-semibold uppercase">
            Schedule
          </h2>
          <p className="weekend-when">{formatEventWindowLabel(data.eventStartsAt, data.eventEndsAt)}</p>
        </div>

        {days.length > 0 ? (
          <div
            className="weekend-tablist"
            role="tablist"
            aria-label="Schedule days"
          >
            {days.map((day, index) => (
              <ScheduleTabButton
                key={day.date}
                date={day.date}
                index={index}
                isSelected={index === activeIndex}
                tabRef={(node) => {
                  tabs.current[index] = node;
                }}
                onSelect={() => setSelectedDate(day.date)}
                onKeyDown={moveFocus}
              />
            ))}
          </div>
        ) : null}

        {days.map((day, index) => (
          <div
            key={day.date}
            id={`schedule-panel-${index + 1}`}
            className="weekend-panel"
            role="tabpanel"
            aria-labelledby={`schedule-tab-${index + 1}`}
            tabIndex={0}
            hidden={index !== activeIndex}
          >
            <div className="weekend-day-head">
              <h3>Day {scheduleDayChapter(index + 1)}</h3>
              <p>{formatScheduleDate(day.date, true)}</p>
            </div>
            {loading ? (
              <p className="weekend-coming-soon" role={index === activeIndex ? "status" : undefined}>
                Loading schedule…
              </p>
            ) : day.entries.length === 0 ? (
              <p className="weekend-coming-soon">Schedule coming soon!</p>
            ) : (
              <ol className="weekend-timeline">
                {day.entries.map((entry) => (
                  <li className="weekend-slot" key={`${day.date}-${entry.id}`}>
                    <time dateTime={new Date(entry.startsAt).toISOString()}>
                      {formatScheduleTime(entry.startsAt)} – {formatScheduleTime(entry.endsAt)}
                    </time>
                    <div>
                      <span>{entry.title}</span>
                      {entry.location ? (
                        <p className="weekend-slot-location">{entry.location}</p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        ))}
      </div>

      <ThemeArt name="cave" className="weekend-art-cave theme-art--on-light" />
      <ThemeArt name="pillars" className="weekend-art-pillars theme-art--on-light" />
      <OliveBranch className="weekend-olive weekend-olive-top" />
      <span className="weekend-meander" data-edge="bottom" aria-hidden="true" />
    </section>
  );
}

function LiveSchedule() {
  const { data, loading } = usePublicSchedule();
  return <ScheduleView data={data} loading={loading} />;
}

export function Schedule() {
  if (!getConvexClient()) {
    return <ScheduleView data={FALLBACK_PUBLIC_SCHEDULE} loading={false} />;
  }
  return <LiveSchedule />;
}
