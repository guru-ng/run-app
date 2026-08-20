import type { Run } from "@/lib/types";

export type BadgeTotals = { totalRuns: number; totalDistanceKm: number };

export type BadgeDefinition = {
	key: string;
	icon: string;
	name: string;
	description: string;
	isMet: (totals: BadgeTotals) => boolean;
};

/**
 * Distance/consistency milestones (gamification #4, see PLAN.md).
 * Deliberately paced: unlocking a dozen of these in week one makes badge
 * #13 meaningless, so early ones are cheap (first run, 5 runs) and later
 * ones are genuinely long-term (500km lifetime).
 */
export const BADGES: BadgeDefinition[] = [
	{
		key: "first_run",
		icon: "🏁",
		name: "First Steps",
		description: "Log your first run",
		isMet: (t) => t.totalRuns >= 1,
	},
	{
		key: "runs_5",
		icon: "🎽",
		name: "Warming Up",
		description: "Log 5 runs",
		isMet: (t) => t.totalRuns >= 5,
	},
	{
		key: "distance_10",
		icon: "🥉",
		name: "10K Club",
		description: "10 lifetime km",
		isMet: (t) => t.totalDistanceKm >= 10,
	},
	{
		key: "runs_25",
		icon: "🏃",
		name: "Regular",
		description: "Log 25 runs",
		isMet: (t) => t.totalRuns >= 25,
	},
	{
		key: "distance_50",
		icon: "🥈",
		name: "50K Club",
		description: "50 lifetime km",
		isMet: (t) => t.totalDistanceKm >= 50,
	},
	{
		key: "distance_100",
		icon: "🥇",
		name: "100K Club",
		description: "100 lifetime km",
		isMet: (t) => t.totalDistanceKm >= 100,
	},
	{
		key: "runs_100",
		icon: "💯",
		name: "Century Club",
		description: "Log 100 runs",
		isMet: (t) => t.totalRuns >= 100,
	},
	{
		key: "distance_500",
		icon: "🏆",
		name: "500K Legend",
		description: "500 lifetime km",
		isMet: (t) => t.totalDistanceKm >= 500,
	},
];

export function computeTotals(runs: Run[]): BadgeTotals {
	return {
		totalRuns: runs.length,
		totalDistanceKm: runs.reduce((sum, r) => sum + r.distance_km, 0),
	};
}

/**
 * Every badge the current totals qualify for that isn't already recorded.
 * Doesn't care *when* a threshold was crossed — used for the silent backfill
 * sync (Dashboard.tsx), so someone who already had 80 lifetime km before
 * this feature shipped gets their badges the next time the app loads, not
 * just on their next marginal crossing.
 */
export function computeQualifyingBadges(
	runs: Run[],
	earnedKeys: ReadonlySet<string>,
): BadgeDefinition[] {
	const totals = computeTotals(runs);
	return BADGES.filter((b) => !earnedKeys.has(b.key) && b.isMet(totals));
}

/**
 * Badges crossed specifically *by* `newRun` — before it, they weren't met;
 * after it, they are. Used for the post-log celebration so an ordinary run
 * doesn't surface an unrelated backlog of already-qualifying-but-unpersisted
 * badges (that's computeQualifyingBadges's job, run silently elsewhere).
 */
export function computeNewlyCrossedBadges(
	newRun: Run,
	priorRuns: Run[],
	earnedKeys: ReadonlySet<string>,
): BadgeDefinition[] {
	const before = computeTotals(priorRuns);
	const after = computeTotals([...priorRuns, newRun]);
	return BADGES.filter((b) => !earnedKeys.has(b.key) && !b.isMet(before) && b.isMet(after));
}

export function describeNewBadges(badges: BadgeDefinition[]): string | null {
	if (badges.length === 0) return null;
	if (badges.length === 1) return `🏅 New badge: ${badges[0].icon} ${badges[0].name}`;
	return `🏅 ${badges.length} new badges: ${badges.map((b) => `${b.icon} ${b.name}`).join(", ")}`;
}
