import { supabase } from "@/lib/supabase";
import type { FeedRun, Match, Run } from "@/lib/types";
import { startOfWeekIso } from "@/lib/dates";
import type { ApiResult } from "@/lib/api/types";

export async function fetchOwnRuns(userId: string): Promise<ApiResult<Run[]>> {
	const { data, error } = await supabase
		.from("runs")
		.select("id, distance_km, run_date, notes")
		.eq("user_id", userId)
		.order("run_date", { ascending: false })
		.order("created_at", { ascending: false });
	return { data: (data as Run[]) ?? null, error };
}

/**
 * A single run for the detail page. Scoped to `userId` on purpose — the run
 * page is your own logs only, so someone else's id in the URL returns nothing
 * rather than leaking a row if RLS ever loosens.
 */
export async function fetchRunById(id: string, userId: string): Promise<ApiResult<Run>> {
	const { data, error } = await supabase
		.from("runs")
		.select("id, distance_km, run_date, notes")
		.eq("id", id)
		.eq("user_id", userId)
		.maybeSingle();
	return { data: (data as Run) ?? null, error };
}

export async function insertRun(input: {
	userId: string;
	distanceKm: number;
	runDate: string;
	notes: string | null;
}): Promise<ApiResult<Run>> {
	const { data, error } = await supabase
		.from("runs")
		.insert({
			user_id: input.userId,
			distance_km: input.distanceKm,
			run_date: input.runDate,
			notes: input.notes,
		})
		.select("id, distance_km, run_date, notes")
		.single();
	return { data: (data as Run) ?? null, error };
}

type FeedRow = {
	id: string;
	distance_km: number;
	run_date: string;
	notes: string | null;
	user_id: string;
	profiles: { display_name: string } | null;
};

function mapFeedRow(r: FeedRow): FeedRun {
	return {
		id: r.id,
		distance_km: r.distance_km,
		run_date: r.run_date,
		notes: r.notes,
		user_id: r.user_id,
		display_name: r.profiles?.display_name ?? "Runner",
	};
}

/**
 * Site-wide feed of logged runs, newest first. `offset` defaults to 0, so a
 * first page can just pass `{ limit }` — range(0, limit-1) is equivalent to
 * `.limit(limit)`. Pass `userId` to scope the feed to one user (PostsPage's
 * per-author pagination).
 */
export async function fetchRunsFeed(opts: {
	limit: number;
	offset?: number;
	userId?: string;
}): Promise<ApiResult<FeedRun[]>> {
	const offset = opts.offset ?? 0;
	let query = supabase
		.from("runs")
		.select("id, distance_km, run_date, notes, user_id, profiles(display_name)");
	if (opts.userId) query = query.eq("user_id", opts.userId);
	const { data, error } = await query
		.order("run_date", { ascending: false })
		.order("created_at", { ascending: false })
		.range(offset, offset + opts.limit - 1);
	const rows = (data as unknown as FeedRow[]) ?? [];
	return { data: error ? null : rows.map(mapFeedRow), error };
}

/** How many matches the dashboard shows. */
const MATCH_LIMIT = 12;

/**
 * Others within +/-0.5km of `myLatestDistance`, logged this week, closest first.
 *
 * "Closest" can't be ordered in a single query: PostgREST's `order` takes a
 * column, not an expression, so there's no `abs(distance_km - target)` to sort
 * by without a database function. A single capped query would therefore hand
 * back an arbitrary slice of the band and rank only that.
 *
 * Instead, take the nearest MATCH_LIMIT strictly below the target and the
 * nearest MATCH_LIMIT at or above it — each ordered in the database, so each is
 * deterministic — then merge and rank. Any of the true closest MATCH_LIMIT has
 * to be in that union, and it transfers at most 2 x MATCH_LIMIT rows, well
 * under the old candidate pool. The two bands don't overlap, which matters
 * because a match row has no id to de-duplicate on.
 */
export async function fetchMatches(opts: {
	userId: string;
	myLatestDistance: number;
}): Promise<ApiResult<Match[]>> {
	const weekStart = startOfWeekIso();
	const inRangeThisWeek = () =>
		supabase
			.from("runs")
			.select("distance_km, run_date, profiles(display_name)")
			.gte("run_date", weekStart)
			.neq("user_id", opts.userId);

	const [below, above] = await Promise.all([
		// [target - 0.5, target) — descending, so the closest come first.
		inRangeThisWeek()
			.gte("distance_km", opts.myLatestDistance - 0.5)
			.lt("distance_km", opts.myLatestDistance)
			.order("distance_km", { ascending: false })
			.limit(MATCH_LIMIT),
		// [target, target + 0.5] — ascending, likewise.
		inRangeThisWeek()
			.gte("distance_km", opts.myLatestDistance)
			.lte("distance_km", opts.myLatestDistance + 0.5)
			.order("distance_km", { ascending: true })
			.limit(MATCH_LIMIT),
	]);

	const error = below.error ?? above.error;
	if (error) return { data: null, error };

	const rows = [
		...((below.data as unknown as Match[]) ?? []),
		...((above.data as unknown as Match[]) ?? []),
	];
	rows.sort(
		(a, b) =>
			Math.abs(a.distance_km - opts.myLatestDistance) -
			Math.abs(b.distance_km - opts.myLatestDistance),
	);
	// Rank first, then truncate to what the dashboard renders.
	return { data: rows.slice(0, MATCH_LIMIT), error: null };
}
