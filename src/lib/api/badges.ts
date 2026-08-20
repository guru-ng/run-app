import { supabase } from "@/lib/supabase";
import type { EarnedBadge } from "@/lib/types";
import type { ApiResult } from "@/lib/api/types";

export async function fetchEarnedBadges(userId: string): Promise<ApiResult<EarnedBadge[]>> {
	const { data, error } = await supabase
		.from("badges_earned")
		.select("badge_key, earned_at")
		.eq("user_id", userId);
	return { data: (data as EarnedBadge[]) ?? null, error };
}

/**
 * Persist newly earned badges. `unique (user_id, badge_key)` plus
 * `ignoreDuplicates` means a repeat call (e.g. the backfill sync and a
 * fresh log both noticing the same badge around the same time) is a
 * harmless no-op rather than a conflict error.
 */
export async function insertEarnedBadges(
	userId: string,
	badgeKeys: string[],
): Promise<ApiResult<EarnedBadge[]>> {
	if (badgeKeys.length === 0) return { data: [], error: null };
	const { data, error } = await supabase
		.from("badges_earned")
		.upsert(
			badgeKeys.map((badge_key) => ({ user_id: userId, badge_key })),
			{ onConflict: "user_id,badge_key", ignoreDuplicates: true },
		)
		.select("badge_key, earned_at");
	return { data: (data as EarnedBadge[]) ?? null, error };
}
