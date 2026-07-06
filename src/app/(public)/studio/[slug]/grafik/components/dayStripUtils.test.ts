import assert from "node:assert/strict";

import {
  addDays,
  buildWeekDays,
  getCircleBackgroundClass,
  getLabelColorClass,
  getNumberColorClass,
  shouldCommitSwipe,
  toDateStr,
} from "./dayStripUtils";

// toDateStr
assert.equal(toDateStr(new Date(2026, 6, 6)), "2026-07-06");
assert.equal(toDateStr(new Date(2026, 0, 1)), "2026-01-01");

// addDays
assert.equal(toDateStr(addDays(new Date(2026, 6, 27), 7)), "2026-08-03");
assert.equal(toDateStr(addDays(new Date(2026, 6, 6), -7)), "2026-06-29");

// buildWeekDays: 2026-07-06 is a Monday, todayStr is Wednesday 2026-07-08
const monday = new Date(2026, 6, 6);
const days = buildWeekDays(monday, [2, 0, 1, 0, 0, 0, 3], "2026-07-08");

assert.equal(days.length, 7);
assert.deepEqual(
  days.map((d) => d.date),
  [
    "2026-07-06",
    "2026-07-07",
    "2026-07-08",
    "2026-07-09",
    "2026-07-10",
    "2026-07-11",
    "2026-07-12",
  ],
);
assert.deepEqual(
  days.map((d) => d.dayLabel),
  ["PN", "WT", "ŚR", "CZ", "PT", "SO", "ND"],
);
assert.deepEqual(
  days.map((d) => d.isWeekend),
  [false, false, false, false, false, true, true],
);
assert.deepEqual(
  days.map((d) => d.isPast),
  [true, true, false, false, false, false, false],
);
assert.deepEqual(
  days.map((d) => d.isToday),
  [false, false, true, false, false, false, false],
);
// isMuted: past days are always muted; future/today days are muted only when they have no
// sessions. counts [2, 0, 1, 0, 0, 0, 3] -> hasSessions [true, false, true, false, false, false, true]
assert.deepEqual(
  days.map((d) => d.isMuted),
  [true, true, false, true, true, true, false],
);

// buildWeekDays crossing a month boundary
const daysAcrossMonth = buildWeekDays(new Date(2026, 6, 27), [], "2026-07-08");
assert.deepEqual(
  daysAcrossMonth.map((d) => d.dayNumber),
  [27, 28, 29, 30, 31, 1, 2],
);
assert.deepEqual(
  daysAcrossMonth.map((d) => d.date),
  [
    "2026-07-27",
    "2026-07-28",
    "2026-07-29",
    "2026-07-30",
    "2026-07-31",
    "2026-08-01",
    "2026-08-02",
  ],
);

// buildWeekDays: sessionCounts shorter than 7 entries defaults missing days to no sessions.
// Uses a week entirely in the future (relative to todayStr) to isolate the hasSessions effect
// from isPast.
const futureMonday = new Date(2026, 6, 13);
const sparse = buildWeekDays(futureMonday, [1], "2026-07-08");
assert.deepEqual(
  sparse.map((d) => d.isMuted),
  [false, true, true, true, true, true, true],
);

// buildWeekDays: sessionsKnown=false never mutes for lack of sessions, only for isPast
const unknown = buildWeekDays(monday, [], "2026-07-08", false);
assert.deepEqual(
  unknown.map((d) => d.isMuted),
  [true, true, false, false, false, false, false],
);

// getLabelColorClass
assert.equal(getLabelColorClass({ ...days[0], isMuted: true, isWeekend: false }), "text-gray-300");
assert.equal(getLabelColorClass({ ...days[0], isMuted: false, isWeekend: true }), "text-brand-red");
assert.equal(getLabelColorClass({ ...days[0], isMuted: false, isWeekend: false }), "text-gray-500");

// getNumberColorClass
assert.equal(getNumberColorClass({ ...days[0], isToday: true }, true), "text-white");
assert.equal(getNumberColorClass({ ...days[0], isToday: true }, false), "text-brand-green-700");
assert.equal(getNumberColorClass({ ...days[0], isToday: false }, true), "text-white");
assert.equal(
  getNumberColorClass({ ...days[0], isToday: false, isMuted: true }, false),
  "text-gray-300",
);
assert.equal(
  getNumberColorClass({ ...days[0], isToday: false, isMuted: false }, false),
  "text-gray-900",
);

// getCircleBackgroundClass
assert.equal(getCircleBackgroundClass({ ...days[0], isToday: true }), "bg-brand-green-700");
assert.equal(getCircleBackgroundClass({ ...days[0], isToday: false }), "bg-gray-900");

// shouldCommitSwipe
assert.equal(shouldCommitSwipe(-50, 0, 300), false);
assert.equal(shouldCommitSwipe(-100, 0, 300), true);
assert.equal(shouldCommitSwipe(-10, -600, 300), true);
assert.equal(shouldCommitSwipe(10, 0, 0), false);
