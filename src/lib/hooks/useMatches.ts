import { useEffect, useState } from "react";
import type { PostgrestError } from "@supabase/supabase-js";
import { fetchMatches } from "@/lib/api/runs";
import type { Match } from "@/lib/types";

export function useMatches(userId: string, myLatestDistance: number | null) {
	const [matches, setMatches] = useState<Match[] | null>(null);
	const [error, setError] = useState<PostgrestError | null>(null);

	useEffect(() => {
		if (myLatestDistance == null) {
			setMatches([]);
			return;
		}
		setMatches(null);
		setError(null);
		fetchMatches({ userId, myLatestDistance }).then(({ data, error }) => {
			if (error) {
				setError(error);
				return;
			}
			setMatches(data ?? []);
		});
	}, [myLatestDistance, userId]);

	return { matches, error, loading: matches === null && !error };
}
