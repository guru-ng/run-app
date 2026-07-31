import { useMatches } from "@/lib/hooks/useMatches";
import SwipeStack from "@/components/ui/SwipeStack";

export default function MatchesDeck({
	userId,
	myLatestDistance,
}: {
	userId: string;
	myLatestDistance: number | null;
}) {
	const { matches, error } = useMatches(userId, myLatestDistance);

	return (
		<div className="deck-section">
			<h2 className="brand-title" style={{ fontSize: "1.1rem" }}>
				Matches
			</h2>
			{error ? (
				<p className="error">{error.message}</p>
			) : myLatestDistance == null ? (
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
