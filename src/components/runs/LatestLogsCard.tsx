import { useRunsFeedPaginated } from "@/lib/hooks/useRunsFeed";
import { shortDateLabel } from "@/lib/dates";

const PAGE_SIZE = 3;

export default function LatestLogsCard() {
	const { pageFeed, error, loading, loadingMore, hasNext, hasPrev, goNewer, goOlder } =
		useRunsFeedPaginated(PAGE_SIZE);

	return (
		<div>
			<div className="post-card-head">
				<h2 className="brand-title" style={{ fontSize: "1.1rem" }}>
					Latest logs
				</h2>
				{loadingMore ? (
					<div className="loading-runner" aria-label="Loading earlier logs">
						<span className="runner-icon">🏃</span>
						<span className="runner-track" />
					</div>
				) : (
					<div className="post-card-nav">
						<button
							className="page-nav-btn"
							disabled={!hasPrev}
							onClick={goNewer}
							aria-label="Newer logs"
						>
							‹
						</button>
						<button
							className="page-nav-btn"
							disabled={!hasNext}
							onClick={goOlder}
							aria-label="Older logs"
						>
							›
						</button>
					</div>
				)}
			</div>
			<div className="runs-list">
				{error ? (
					<p className="error">{error.message}</p>
				) : loading ? (
					<p className="muted">Loading…</p>
				) : pageFeed.length === 0 ? (
					<p className="muted">No runs logged yet.</p>
				) : (
					pageFeed.map((run) => (
						<div className="run-item" key={run.id}>
							<span>{run.display_name}</span>
							<span>
								{shortDateLabel(run.run_date)} · {run.distance_km} km
							</span>
						</div>
					))
				)}
			</div>
			<a href="/posts" className="link">
				See all →
			</a>
		</div>
	);
}
