import type {
  ScheduleDaySummary,
  ScheduleOccurrence,
  ScheduleWeekResponse,
  SessionDetailResponse,
} from "@/app/account/partner/schedule/types";
import type { ClassColor } from "@/lib/classColors";

import { at, INSTRUCTORS, OCC, ROOMS, STUDIO, TEMPLATES, WEEK_END, WEEK_START } from "./ids";

/**
 * A full week of sessions, 2026-09-07 (Mon) to 2026-09-13 (Sun), with TODAY = Wednesday.
 *
 * Deliberately uneven: two sessions on Monday and Wednesday, one on Tuesday and Thursday, one at
 * the weekend, nothing on Friday evening and nothing on Sunday. An evenly-filled week is the
 * fixture that makes every layout look fine — a real Grafik has gaps, a cancelled session and a
 * couple of unresolved counts, and those are the cases a prototype needs to face.
 *
 * `color` values are class-palette KEYS, never hex (see src/lib/classColors.ts).
 */
function occurrence(
  id: string,
  date: string,
  start: string,
  end: string,
  template: { id: string; title: string },
  instructor: { id: string; name: string },
  color: ClassColor,
  extra: Partial<ScheduleOccurrence> = {},
): ScheduleOccurrence {
  return {
    id,
    start_time: at(date, start),
    end_time: at(date, end),
    calendar_date: date,
    status: "scheduled",
    is_modified: false,
    template_id: template.id,
    template_title: template.title,
    instructor_id: instructor.id,
    instructor_name: instructor.name,
    room_id: ROOMS.main.id,
    room_name: ROOMS.main.name,
    capacity: 16,
    fill_count: 0,
    notified_count: 0,
    attended_count: 0,
    unresolved_count: 0,
    studio_id: STUDIO.id,
    studio_name: STUDIO.name,
    instructor_image_id: null,
    color,
    recurrence_frequency: "WEEKLY",
    recurrence_days: ["MO", "WE", "FR"],
    ...extra,
  };
}

export const occurrences: Record<keyof typeof OCC, ScheduleOccurrence> = {
  monMorning: occurrence(
    OCC.monMorning,
    "2026-09-07",
    "07:00",
    "08:15",
    TEMPLATES.hatha,
    INSTRUCTORS.owner,
    "green",
    { fill_count: 11, attended_count: 11, unresolved_count: 0 },
  ),
  monEvening: occurrence(
    OCC.monEvening,
    "2026-09-07",
    "18:00",
    "19:15",
    TEMPLATES.vinyasa,
    INSTRUCTORS.linked,
    "teal",
    {
      fill_count: 16,
      attended_count: 15,
      unresolved_count: 2,
      room_id: ROOMS.small.id,
      room_name: ROOMS.small.name,
      capacity: 16,
    },
  ),
  tueEvening: occurrence(
    OCC.tueEvening,
    "2026-09-08",
    "18:30",
    "19:45",
    TEMPLATES.beginners,
    INSTRUCTORS.awaiting,
    "lavender",
    { fill_count: 6, attended_count: 6, unresolved_count: 1, recurrence_days: ["TU"] },
  ),
  wedMorning: occurrence(
    OCC.wedMorning,
    "2026-09-09",
    "07:00",
    "08:15",
    TEMPLATES.hatha,
    INSTRUCTORS.owner,
    "green",
    { fill_count: 9 },
  ),
  wedEvening: occurrence(
    OCC.wedEvening,
    "2026-09-09",
    "18:00",
    "19:15",
    TEMPLATES.vinyasa,
    INSTRUCTORS.linked,
    "teal",
    { fill_count: 14 },
  ),
  thuEvening: occurrence(
    OCC.thuEvening,
    "2026-09-10",
    "18:30",
    "19:45",
    TEMPLATES.nidra,
    INSTRUCTORS.linked,
    "blue",
    {
      fill_count: 4,
      capacity: 10,
      recurrence_days: ["TH"],
      room_id: ROOMS.small.id,
      room_name: ROOMS.small.name,
    },
  ),
  friMorning: occurrence(
    OCC.friMorning,
    "2026-09-11",
    "07:00",
    "08:15",
    TEMPLATES.hatha,
    INSTRUCTORS.owner,
    "green",
    { fill_count: 7 },
  ),
  // A cancelled session, so a prototype has to face the state rather than assume it away.
  satMidday: occurrence(
    OCC.satMidday,
    "2026-09-12",
    "10:00",
    "11:30",
    TEMPLATES.mysore,
    INSTRUCTORS.noAccount,
    "sand",
    {
      status: "cancelled",
      is_modified: true,
      fill_count: 5,
      notified_count: 5,
      recurrence_frequency: null,
      recurrence_days: [],
    },
  ),
};

const byDate: Record<string, ScheduleOccurrence[]> = {
  "2026-09-07": [occurrences.monMorning, occurrences.monEvening],
  "2026-09-08": [occurrences.tueEvening],
  "2026-09-09": [occurrences.wedMorning, occurrences.wedEvening],
  "2026-09-10": [occurrences.thuEvening],
  "2026-09-11": [occurrences.friMorning],
  "2026-09-12": [occurrences.satMidday],
  "2026-09-13": [],
};

export const scheduleDays: ScheduleDaySummary[] = Object.entries(byDate).map(([date, list]) => ({
  date,
  session_count: list.length,
  occurrences: list,
}));

export const scheduleWeek: ScheduleWeekResponse = {
  studio_id: STUDIO.id,
  week_start: WEEK_START,
  week_end: WEEK_END,
  days: scheduleDays,
};

/** Detail for the Wednesday evening session — the one the front desk fixture also works on. */
export const sessionDetail: SessionDetailResponse = {
  id: OCC.wedEvening,
  calendar_date: "2026-09-09",
  start_time: at("2026-09-09", "18:00"),
  end_time: at("2026-09-09", "19:15"),
  status: "scheduled",
  is_modified: false,
  instructor_id: INSTRUCTORS.linked.id,
  instructor_name: INSTRUCTORS.linked.name,
  room_id: ROOMS.main.id,
  room_name: ROOMS.main.name,
  capacity: 16,
  template_id: TEMPLATES.vinyasa.id,
  template_title: TEMPLATES.vinyasa.title,
  template_duration_minutes: 75,
  color: "teal",
  studio_id: STUDIO.id,
  studio_name: STUDIO.name,
  schedule_id: "sch-autumn-2026",
  role: "owner",
  is_recurring: true,
  series_to_date: "2026-12-20",
  series_from_date: "2026-09-09",
  recurrence_frequency: "WEEKLY",
  recurrence_days: ["MO", "WE"],
  notified_count: 0,
};
