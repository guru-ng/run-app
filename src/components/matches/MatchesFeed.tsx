import { useMatches } from "@/lib/hooks/useMatches";

export default function MatchesFeed({
	userId,
	myLatestDistance,
}: {
	userId: string;
	myLatestDistance: number | null;
}) {
	const { matches, error } = useMatches(userId, myLatestDistance);

	return (
		<>
			<h2 className="brand-title" style={{ fontSize: "1.1rem" }}>
				Similar distance this week
			</h2>
			<div className="runs-list">
				{error ? (
					<p className="error">{error.message}</p>
				) : myLatestDistance == null ? (
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
