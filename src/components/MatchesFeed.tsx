import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Match } from "@/lib/types";

export default function MatchesFeed({
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
		<>
			<h2 className="brand-title" style={{ fontSize: "1.1rem" }}>
				Similar distance this week
			</h2>
			<div className="runs-list">
				{myLatestDistance == null ? (
					<p className="muted">Log a run to see others with a similar distance this week.</p>
				) : matches === null ? (
					<p className="muted">Loading matches…</p>
				) : matches.length === 0 ? (
					<p className="muted">No one within 0.5 km of your distance this week yet.</p>
				) : (
					matches.map((match, i) => (
						<div className="run-item" key={i}>
							<span>{match.profiles?.display_name ?? "Runner"}</span>
							<span>{match.distance_km} km</span>
						</div>
					))
				)}
			</div>
		</>
	);
}

function startOfWeekIso() {
	const now = new Date();
	const day = (now.getDay() + 6) % 7; // 0 = Monday
	now.setDate(now.getDate() - day);
	return now.toISOString().slice(0, 10);
}
