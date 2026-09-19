import { cronJobs } from "convex/server";
import { makeFunctionReference } from "convex/server";

const crons = cronJobs();

crons.hourly(
  "delete expired unassociated resume uploads",
  { minuteUTC: 17 },
  makeFunctionReference<"mutation">("registrations:cleanupExpiredResumeUploads"),
  {},
);

export default crons;
