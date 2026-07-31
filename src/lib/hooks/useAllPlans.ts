import { useEffect, useState } from "react";
import type { PostgrestError } from "@supabase/supabase-js";
import { fetchAllPlans } from "@/lib/api/plannedRuns";
import type { DayAvailability } from "@/lib/types";

/** `enabled: false` skips the query entirely — for pages that don't show plans. */
export function useAllPlans(enabled = true) {
	const [allPlans, setAllPlans] = useState<DayAvailability[] | null>(null);
	const [error, setError] = useState<PostgrestError | null>(null);

	useEffect(() => {
		if (!enabled) return;
		fetchAllPlans().then(({ data, error }) => {
			if (error) {
				setError(error);
				return;
			}
			setAllPlans(data ?? []);
		});
	}, [enabled]);

	return { allPlans, error, loading: allPlans === null && !error, setAllPlans };
}
