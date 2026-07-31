import { useEffect, useState } from "react";
import type { PostgrestError } from "@supabase/supabase-js";
import { fetchOwnRuns } from "@/lib/api/runs";
import type { Run } from "@/lib/types";

/** `enabled: false` skips the query entirely — for pages that don't show runs. */
export function useOwnRuns(userId: string, enabled = true) {
	const [runs, setRuns] = useState<Run[] | null>(null);
	const [error, setError] = useState<PostgrestError | null>(null);

	useEffect(() => {
		if (!enabled) return;
		setRuns(null);
		setError(null);
		fetchOwnRuns(userId).then(({ data, error }) => {
			if (error) {
				setError(error);
				return;
			}
			setRuns(data ?? []);
		});
	}, [userId, enabled]);

	return { runs, error, loading: runs === null && !error, setRuns };
}
