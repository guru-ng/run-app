import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { FeedRun } from "@/lib/types";
import { shortDateLabel } from "@/lib/dates";

const PAGE_SIZE = 3;

type FeedRow = {
	id: string;
	distance_km: number;
	run_date: string;
	notes: string | null;
	user_id: string;
	profiles: { display_name: string } | null;
};

function mapRow(r: FeedRow): FeedRun {
	return {
		id: r.id,
		distance_km: r.distance_km,
		run_date: r.run_date,
		notes: r.notes,
		user_id: r.user_id,
		display_name: r.profiles?.display_name ?? "Runner",
	};
}

export default function LatestLogsCard() {
	const [feed, setFeed] = useState<FeedRun[] | null>(null);
	const [page, setPage] = useState(0);
	const [loadingMore, setLoadingMore] = useState(false);
	const [hasMore, setHasMore] = useState(true);

	useEffect(() => {
		supabase
			.from("runs")
			.select("id, distance_km, run_date, notes, user_id, profiles(display_name)")
			.order("run_date", { ascending: false })
			.order("created_at", { ascending: false })
			.limit(PAGE_SIZE)
			.then(({ data }) => {
				const rows = (data as unknown as FeedRow[]) ?? [];
				setFeed(rows.map(mapRow));
				setHasMore(rows.length === PAGE_SIZE);
			});
	}, []);

	function goNewer() {
		setPage((p) => Math.max(0, p - 1));
	}

	async function goOlder() {
		if (!feed || loadingMore) return;
		const nextPage = page + 1;
		const cachedEnd = nextPage * PAGE_SIZE + PAGE_SIZE;

		if (feed.length >= cachedEnd || !hasMore) {
			if (nextPage * PAGE_SIZE < feed.length) setPage(nextPage);
			return;
		}

		setLoadingMore(true);
		const { data } = await supabase
			.from("runs")
			.select("id, distance_km, run_date, notes, user_id, profiles(display_name)")
			.order("run_date", { ascending: false })
			.order("created_at", { ascending: false })
			.range(feed.length, feed.length + PAGE_SIZE - 1);

		const rows = (data as unknown as FeedRow[]) ?? [];
		setFeed((prev) => [...(prev ?? []), ...rows.map(mapRow)]);
		setHasMore(rows.length === PAGE_SIZE);
		if (rows.length > 0) setPage(nextPage);
		setLoadingMore(false);
	}

	const pageFeed = (feed ?? []).slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
	const hasNext = feed !== null && ((page + 1) * PAGE_SIZE < feed.length || hasMore);

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
							disabled={page === 0}
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
				{feed === null ? (
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
