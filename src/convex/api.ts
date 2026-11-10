import { makeFunctionReference } from "convex/server";

export type ScheduleEntry = {
  id: string;
  title: string;
  description?: string;
  startsAt: number;
  endsAt: number;
  location?: string;
  category: string;
};

export type PublicSchedule = {
  eventStartsAt: number;
  eventEndsAt: number;
  entries: ScheduleEntry[];
};

export const listPublicScheduleRef = makeFunctionReference<
  "query",
  Record<string, never>,
  PublicSchedule
>("profile/schedule:listPublicSchedule");
