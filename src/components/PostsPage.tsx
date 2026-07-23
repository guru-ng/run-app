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

type UserPosts = {
	user_id: string;
	display_name: string;
	runs: FeedRun[];
};

export default function PostsPage() {
	const [ready, setReady] = useState(false);
	const [byUser, setByUser] = useState<UserPosts[] | null>(null);

	// Real route outside the tab-state island — needs its own auth check.
	useEffect(() => {
		supabase.auth.getSession().then(({ data }) => {
			if (!data.session) {
				window.location.href = "/";
				return;
			}
			setReady(true);
		});
		const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
			if (!session) window.location.href = "/";
		});
		return () => sub.subscription.unsubscribe();
	}, []);

	useEffect(() => {
		if (!ready) return;
		supabase
			.from("runs")
			.select("id, distance_km, run_date, notes, user_id, profiles(display_name)")
			.order("run_date", { ascending: false })
			.order("created_at", { ascending: false })
			.limit(50)
			.then(({ data }) => {
				const rows = (data as unknown as FeedRow[]) ?? [];
				const order: string[] = [];
				const grouped = new Map<string, UserPosts>();
				for (const r of rows) {
					if (!grouped.has(r.user_id)) {
						grouped.set(r.user_id, {
							user_id: r.user_id,
							display_name: r.profiles?.display_name ?? "Runner",
							runs: [],
						});
						order.push(r.user_id);
					}
					grouped.get(r.user_id)!.runs.push({
						id: r.id,
						distance_km: r.distance_km,
						run_date: r.run_date,
						notes: r.notes,
						user_id: r.user_id,
						display_name: r.profiles?.display_name ?? "Runner",
					});
				}
				setByUser(order.map((id) => grouped.get(id)!));
			});
	}, [ready]);

	if (!ready) return <div className="panel">Loading…</div>;

	return (
		<div className="posts-grid">
			{byUser === null ? (
				<p className="muted">Loading…</p>
			) : byUser.length === 0 ? (
				<p className="muted">No runs logged yet.</p>
			) : (
				byUser.map((user) => (
					<div className="panel post-card" key={user.user_id}>
						<h2 className="brand-title" style={{ fontSize: "1.2rem" }}>
							{user.display_name}
						</h2>
						<div className="runs-list">
							{user.runs.slice(0, 5).map((run) => (
								<div className="run-item" key={run.id}>
									<span>{shortDateLabel(run.run_date)}</span>
									<span>{run.distance_km} km</span>
									{run.notes && <span className="muted">{run.notes}</span>}
								</div>
							))}
						</div>
					</div>
				))
			)}
		</div>
	);
}
