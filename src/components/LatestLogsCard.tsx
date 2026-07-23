import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { FeedRun } from "@/lib/types";
import { shortDateLabel } from "@/lib/dates";

type FeedRow = {
	id: string;
	distance_km: number;
	run_date: string;
	notes: string | null;
	user_id: string;
	profiles: { display_name: string } | null;
};

export default function LatestLogsCard() {
	const [feed, setFeed] = useState<FeedRun[] | null>(null);

	useEffect(() => {
		supabase
			.from("runs")
			.select("id, distance_km, run_date, notes, user_id, profiles(display_name)")
			.order("run_date", { ascending: false })
			.order("created_at", { ascending: false })
			.limit(5)
			.then(({ data }) => {
				const rows = (data as unknown as FeedRow[]) ?? [];
				setFeed(
					rows.map((r) => ({
						id: r.id,
						distance_km: r.distance_km,
						run_date: r.run_date,
						notes: r.notes,
						user_id: r.user_id,
						display_name: r.profiles?.display_name ?? "Runner",
					})),
				);
			});
	}, []);

	return (
		<div>
			<h2 className="brand-title" style={{ fontSize: "1.1rem" }}>
				Latest logs
			</h2>
			<div className="runs-list">
				{feed === null ? (
					<p className="muted">Loading…</p>
				) : feed.length === 0 ? (
					<p className="muted">No runs logged yet.</p>
				) : (
					feed.map((run) => (
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
