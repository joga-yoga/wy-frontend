import { isAtOrPastWarsawWallClock } from "@/lib/warsawWallClock";

export function isSubstitutionVisible(
  session: { status: string; start_time: string; is_substitution?: boolean },
  now = new Date(),
): boolean {
  return (
    session.is_substitution === true &&
    session.status !== "cancelled" &&
    !isAtOrPastWarsawWallClock(session.start_time, now)
  );
}
