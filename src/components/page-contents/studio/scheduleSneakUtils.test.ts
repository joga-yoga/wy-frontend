import assert from "node:assert/strict";

import { formatSneakDayHeader, isSessionOver } from "./scheduleSneakUtils";

// today
assert.equal(formatSneakDayHeader("2026-07-08", "2026-07-08"), "DZIŚ · 8 lip");

// tomorrow
assert.equal(formatSneakDayHeader("2026-07-09", "2026-07-08"), "JUTRO · 9 lip");

// a later weekday this week (2026-07-11 is a Saturday)
assert.equal(formatSneakDayHeader("2026-07-11", "2026-07-08"), "SOB · 11 lip");

// month boundary: today is 2026-07-30, target is two days later (not "tomorrow"), crossing into August
assert.equal(formatSneakDayHeader("2026-08-01", "2026-07-30"), "SOB · 1 sie");

// isSessionOver: strictly before end time -> not over; at or after end time -> over
assert.equal(isSessionOver("2026-07-06T10:00:00", new Date("2026-07-06T09:00:00")), false);
assert.equal(isSessionOver("2026-07-06T10:00:00", new Date("2026-07-06T10:00:00")), true);
assert.equal(isSessionOver("2026-07-06T10:00:00", new Date("2026-07-06T11:00:00")), true);

// isSessionOver: the API serializes end_time with a "Z" suffix even though the digits are
// Europe/Warsaw wall-clock time, not real UTC (the app has no timezone support). A session
// ending at 13:00 Warsaw time must read as over at 13:31 Warsaw time.
assert.equal(isSessionOver("2026-07-08T13:00:00Z", new Date("2026-07-08T13:31:00")), true);
assert.equal(isSessionOver("2026-07-08T13:00:00Z", new Date("2026-07-08T12:59:00")), false);
