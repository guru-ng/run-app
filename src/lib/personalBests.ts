import type { Run } from "@/lib/types";
import { startOfWeekIso } from "@/lib/dates";

export type PersonalBest =
	| { type: "first" }
	| { type: "longest"; distanceKm: number }
	| { type: "week-count"; count: number };

/**
 * The single most notable thing about a freshly logged run, if any —
 * surfaced right at the moment of logging (gamification #2, see PLAN.md),
 * not buried on a stats page nobody visits. `priorRuns` is the user's runs
 * from *before* this one; checks in order of how good a callout they make
 * (longest-ever beats "3rd run this week"), returns the first match.
 */
export function computePersonalBest(newRun: Run, priorRuns: Run[]): PersonalBest | null {
	if (priorRuns.length === 0) {
		return { type: "first" };
	}

	const longestPrior = Math.max(...priorRuns.map((r) => r.distance_km));
	if (newRun.distance_km > longestPrior) {
		return { type: "longest", distanceKm: newRun.distance_km };
	}

	const weekStart = startOfWeekIso();
	const thisWeekCount = priorRuns.filter((r) => r.run_date >= weekStart).length + 1;
	if (thisWeekCount >= 3) {
		return { type: "week-count", count: thisWeekCount };
	}

	return null;
}

/** `null` covers an ordinary log that isn't a personal best — still worth a friendly line. */
export function describePersonalBest(best: PersonalBest | null): string {
	if (!best) return "✅ Run logged!";
	switch (best.type) {
		case "first":
			return "🏁 First run logged — welcome to the log!";
		case "longest":
			return `🎉 Longest run yet — ${best.distanceKm.toFixed(2)} km!`;
		case "week-count":
			return `🔥 ${best.count}${ordinalSuffix(best.count)} run this week!`;
	}
}

function ordinalSuffix(n: number): string {
	if (n % 100 >= 11 && n % 100 <= 13) return "th";
	switch (n % 10) {
		case 1:
			return "st";
		case 2:
			return "nd";
		case 3:
			return "rd";
		default:
			return "th";
	}
}
