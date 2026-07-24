import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { FeedRun } from "@/lib/types";
import { shortDateLabel } from "@/lib/dates";
import SwipeStack from "@/components/SwipeStack";

const PAGE_SIZE = 3;

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
	page: number;
	loadingMore: boolean;
	hasMore: boolean;
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
							page: 0,
							loadingMore: false,
							hasMore: true,
						});
						order.push(r.user_id);
					}
					grouped.get(r.user_id)!.runs.push(mapRow(r));
				}
				setByUser(order.map((id) => grouped.get(id)!));
			});
	}, [ready]);

	function hasNextPage(user: UserPosts) {
		return (user.page + 1) * PAGE_SIZE < user.runs.length || user.hasMore;
	}

	function goNewer(userId: string) {
		setByUser(
			(prev) =>
				prev?.map((u) => (u.user_id === userId && u.page > 0 ? { ...u, page: u.page - 1 } : u)) ??
				null,
		);
	}

	async function goOlder(userId: string) {
		const user = byUser?.find((u) => u.user_id === userId);
		if (!user || user.loadingMore || !hasNextPage(user)) return;

		const nextPage = user.page + 1;
		const cachedEnd = nextPage * PAGE_SIZE + PAGE_SIZE;

		if (user.runs.length >= cachedEnd || !user.hasMore) {
			setByUser(
				(prev) =>
					prev?.map((u) => (u.user_id === userId ? { ...u, page: nextPage } : u)) ?? null,
			);
			return;
		}

		setByUser(
			(prev) => prev?.map((u) => (u.user_id === userId ? { ...u, loadingMore: true } : u)) ?? null,
		);

		const { data } = await supabase
			.from("runs")
			.select("id, distance_km, run_date, notes, user_id, profiles(display_name)")
			.eq("user_id", userId)
			.order("run_date", { ascending: false })
			.order("created_at", { ascending: false })
			.range(user.runs.length, user.runs.length + PAGE_SIZE - 1);

		const rows = (data as unknown as FeedRow[]) ?? [];
		setByUser(
			(prev) =>
				prev?.map((u) =>
					u.user_id === userId
						? {
								...u,
								runs: [...u.runs, ...rows.map(mapRow)],
								page: rows.length > 0 ? nextPage : u.page,
								loadingMore: false,
								hasMore: rows.length === PAGE_SIZE,
							}
						: u,
				) ?? null,
		);
	}

	if (!ready) return <div className="panel">Loading…</div>;

	return (
		<div className="posts-grid">
			{byUser === null ? (
				<p className="muted">Loading…</p>
			) : byUser.length === 0 ? (
				<p className="muted">No runs logged yet.</p>
			) : (
				<SwipeStack>
					{byUser.map((user) => (
						<div className="panel post-card" key={user.user_id}>
							<div className="post-card-head">
								<h2 className="brand-title" style={{ fontSize: "1.2rem" }}>
									{user.display_name}
								</h2>
								{user.loadingMore ? (
									<div className="loading-runner" aria-label="Loading earlier logs">
										<span className="runner-icon">🏃</span>
										<span className="runner-track" />
									</div>
								) : (
									<div className="post-card-nav">
										<button
											className="page-nav-btn"
											disabled={user.page === 0}
											onClick={() => goNewer(user.user_id)}
											aria-label="Newer logs"
										>
											‹
										</button>
										<button
											className="page-nav-btn"
											disabled={!hasNextPage(user)}
											onClick={() => goOlder(user.user_id)}
											aria-label="Older logs"
										>
											›
										</button>
									</div>
								)}
							</div>
							<div className="runs-list">
								{user.runs
									.slice(user.page * PAGE_SIZE, user.page * PAGE_SIZE + PAGE_SIZE)
									.map((run) => (
										<div className="run-item" key={run.id}>
											<span>{shortDateLabel(run.run_date)}</span>
											<span>{run.distance_km} km</span>
											{run.notes && <span className="muted">{run.notes}</span>}
										</div>
									))}
							</div>
						</div>
					))}
				</SwipeStack>
			)}
		</div>
	);
}
