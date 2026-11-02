import { useQuery } from "convex/react";
import { listPublicScheduleRef, type PublicSchedule } from "../convex/api";
import { getConvexClient } from "../convex/client";
import { HACKATHON_SCHEDULE } from "../constants/hackathon";

export const FALLBACK_PUBLIC_SCHEDULE: PublicSchedule = {
  eventStartsAt: HACKATHON_SCHEDULE.startsAt,
  eventEndsAt: HACKATHON_SCHEDULE.endsAt,
  entries: [],
};

export function usePublicSchedule(): {
  loading: boolean;
  data: PublicSchedule;
} {
  const client = getConvexClient();
  const schedule = useQuery(listPublicScheduleRef, client ? {} : "skip");

  if (!client) {
    return { loading: false, data: FALLBACK_PUBLIC_SCHEDULE };
  }

  if (schedule === undefined) {
    return { loading: true, data: FALLBACK_PUBLIC_SCHEDULE };
  }

  return { loading: false, data: schedule };
}
