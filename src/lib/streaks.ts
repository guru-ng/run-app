import type { Run } from "@/lib/types";
import { daysBetween, todayIso } from "@/lib/dates";

export type StreakResult = {
	/** Count of distinct run-days in the currently active streak. 0 = no active streak. */
	currentStreak: number;
	/** Whether the single forgiven skip-day has been used within this streak. */
	graceDayUsed: boolean;
};

const NO_STREAK: StreakResult = { currentStreak: 0, graceDayUsed: false };

/**
 * Current logging streak, in distinct run-days, walking backward from the
 * most recent one. Gamification #3 (see PLAN.md) — deliberately forgiving:
 * a raw "any missed day resets to 0" streak reliably punishes someone for
 * traveling or taking a rest day, so **one single skipped day is forgiven
 * per streak** (not per week — simpler to reason about and to explain in
 * the UI: "you get one rest day, use it wisely"). A gap of 2+ full days
 * breaks it. No persistence — recomputed from `runs` every time.
 *
 * Note: the gap between *today* and the most recent logged day doesn't
 * consume the grace token — not having logged yet today, or since
 * yesterday, is treated as normal mid-streak state, not a skip. The grace
 * token only applies to a gap between two already-logged days further
 * back. Deliberately generous rather than strict for a friend-group app.
 */
export function computeStreak(runs: Run[], today: string = todayIso()): StreakResult {
	if (runs.length === 0) return NO_STREAK;

	const days = Array.from(new Set(runs.map((r) => r.run_date))).sort((a, b) => b.localeCompare(a));

	// More than one skipped day since the last logged run means the streak
	// already lapsed — nobody's logged recently enough for it to be "current."
	if (daysBetween(days[0], today) > 2) return NO_STREAK;

	let currentStreak = 1;
	let graceDayUsed = false;
	for (let i = 1; i < days.length; i++) {
		const gap = daysBetween(days[i], days[i - 1]);
		if (gap === 1) {
			currentStreak++;
		} else if (gap === 2 && !graceDayUsed) {
			currentStreak++;
			graceDayUsed = true;
		} else {
			break;
		}
	}
	return { currentStreak, graceDayUsed };
}

export function describeStreak(streak: StreakResult): string | null {
	if (streak.currentStreak < 1) return null;
	const days = streak.currentStreak === 1 ? "day" : "days";
	const grace = streak.graceDayUsed ? " · 1 rest day used" : "";
	return `🔥 ${streak.currentStreak}-${days} streak${grace}`;
}
