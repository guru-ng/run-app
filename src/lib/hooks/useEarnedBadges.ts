import { useEffect, useState } from "react";
import type { PostgrestError } from "@supabase/supabase-js";
import { fetchEarnedBadges } from "@/lib/api/badges";
import type { EarnedBadge } from "@/lib/types";

/** `enabled: false` skips the query entirely — for pages that don't need badges. */
export function useEarnedBadges(userId: string, enabled = true) {
	const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[] | null>(null);
	const [error, setError] = useState<PostgrestError | null>(null);

	useEffect(() => {
		if (!enabled) return;
		setEarnedBadges(null);
		setError(null);
		fetchEarnedBadges(userId).then(({ data, error }) => {
			if (error) {
				setError(error);
				return;
			}
			setEarnedBadges(data ?? []);
		});
	}, [userId, enabled]);

	return { earnedBadges, error, loading: earnedBadges === null && !error, setEarnedBadges };
}
