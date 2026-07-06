import assert from "node:assert/strict";

import { formatSneakDayHeader, isSessionOver } from "./scheduleSneakUtils";

// today
assert.equal(formatSneakDayHeader("2026-07-08", "2026-07-08"), "Dziś, 8 lipca");

// tomorrow
assert.equal(formatSneakDayHeader("2026-07-09", "2026-07-08"), "Jutro, 9 lipca");

// a later weekday this week (2026-07-11 is a Saturday)
assert.equal(formatSneakDayHeader("2026-07-11", "2026-07-08"), "Sobota, 11 lipca");

// month boundary: today is 2026-07-30, target is two days later (not "tomorrow"), crossing into August
assert.equal(formatSneakDayHeader("2026-08-01", "2026-07-30"), "Sobota, 1 sierpnia");

// isSessionOver: strictly before end time -> not over; at or after end time -> over
assert.equal(isSessionOver("2026-07-06T10:00:00", new Date("2026-07-06T09:00:00")), false);
assert.equal(isSessionOver("2026-07-06T10:00:00", new Date("2026-07-06T10:00:00")), true);
assert.equal(isSessionOver("2026-07-06T10:00:00", new Date("2026-07-06T11:00:00")), true);
