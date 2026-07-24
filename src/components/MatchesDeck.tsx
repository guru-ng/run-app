import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Match } from "@/lib/types";
import { startOfWeekIso } from "@/lib/dates";
import SwipeStack from "@/components/SwipeStack";

export default function MatchesDeck({
	userId,
	myLatestDistance,
}: {
	userId: string;
	myLatestDistance: number | null;
}) {
	const [matches, setMatches] = useState<Match[] | null>(null);

	// Match against the most recent run: others within +/-0.5km, logged this week.
	useEffect(() => {
		if (myLatestDistance == null) {
			setMatches([]);
			return;
		}
		supabase
			.from("runs")
			.select("distance_km, run_date, profiles(display_name)")
			.gte("run_date", startOfWeekIso())
			.gte("distance_km", myLatestDistance - 0.5)
			.lte("distance_km", myLatestDistance + 0.5)
			.neq("user_id", userId)
			.then(({ data }) => {
				const rows = (data as unknown as Match[]) ?? [];
				rows.sort(
					(a, b) =>
						Math.abs(a.distance_km - myLatestDistance) -
						Math.abs(b.distance_km - myLatestDistance),
				);
				setMatches(rows);
			});
	}, [myLatestDistance, userId]);

	return (
		<div className="deck-section">
			<h2 className="brand-title" style={{ fontSize: "1.1rem" }}>
				Matches
			</h2>
			{myLatestDistance == null ? (
				<p className="muted">Log a run to see others with a similar distance this week.</p>
			) : matches === null ? (
				<p className="muted">Loading matches…</p>
			) : matches.length === 0 ? (
				<p className="muted">No one within 0.5 km of your distance this week yet.</p>
			) : (
				<SwipeStack loop showDots>
					{matches.map((match, i) => (
						<div className="panel deck-card" key={i}>
							<span className="deck-card-name">{match.profiles?.display_name ?? "Runner"}</span>
							<span className="deck-card-metric">{match.distance_km} km</span>
						</div>
					))}
				</SwipeStack>
			)}
		</div>
	);
}
