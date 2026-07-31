import { useRunsFeedOnce } from "@/lib/hooks/useRunsFeed";
import { shortDateLabel } from "@/lib/dates";
import SwipeStack from "@/components/ui/SwipeStack";

export default function RecentActivityDeck() {
	const { feed, error } = useRunsFeedOnce(10);

	return (
		<div className="deck-section">
			<h2 className="brand-title" style={{ fontSize: "1.1rem" }}>
				Recent Activity
			</h2>
			{error ? (
				<p className="error">{error.message}</p>
			) : feed === null ? (
				<p className="muted">Loading…</p>
			) : feed.length === 0 ? (
				<p className="muted">No runs logged yet.</p>
			) : (
				<SwipeStack loop showDots>
					{feed.map((run) => (
						<div className="panel deck-card" key={run.id}>
							<span className="deck-card-name">{run.display_name}</span>
							<span className="deck-card-metric">{run.distance_km} km</span>
							<span className="muted">{shortDateLabel(run.run_date)}</span>
							{run.notes && <span className="muted">{run.notes}</span>}
						</div>
					))}
				</SwipeStack>
			)}
		</div>
	);
}
