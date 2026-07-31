import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { fetchRunsFeed } from "@/lib/api/runs";
import type { FeedRun } from "@/lib/types";
import { shortDateLabel } from "@/lib/dates";
import SwipeStack from "@/components/ui/SwipeStack";

const PAGE_SIZE = 3;

type UserPosts = {
	user_id: string;
	display_name: string;
	runs: FeedRun[];
	page: number;
	loadingMore: boolean;
	hasMore: boolean;
};

export default function PostsPage() {
	const [ready, setReady] = useState(false);
	const [byUser, setByUser] = useState<UserPosts[] | null>(null);
	const [error, setError] = useState<string | null>(null);

	// Real route outside the tab-state island — needs its own auth check, and
	// the same invite gate App applies: signed in but no profile means the
	// invite was never redeemed, so bounce to / to go through that flow.
	useEffect(() => {
		let cancelled = false;
		supabase.auth.getSession().then(async ({ data }) => {
			if (!data.session) {
				window.location.href = "/";
				return;
			}
			const { data: profile, error: profileError } = await supabase
				.from("profiles")
				.select("id")
				.eq("id", data.session.user.id)
				.maybeSingle();
			if (cancelled) return;
			if (profileError) {
				setError(profileError.message);
				return;
			}
			if (!profile) {
				window.location.href = "/";
				return;
			}
			setReady(true);
		});
		const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
			if (!session) window.location.href = "/";
		});
		return () => {
			cancelled = true;
			sub.subscription.unsubscribe();
		};
	}, []);

	useEffect(() => {
		if (!ready) return;
		fetchRunsFeed({ limit: 50 }).then(({ data, error: feedError }) => {
			// An empty feed and a failed fetch look identical downstream, so bail
			// before grouping rather than rendering "No runs logged yet."
			if (feedError) {
				setError(feedError.message);
				return;
			}
			const rows = data ?? [];
			const order: string[] = [];
			const grouped = new Map<string, UserPosts>();
			for (const r of rows) {
				if (!grouped.has(r.user_id)) {
					grouped.set(r.user_id, {
						user_id: r.user_id,
						display_name: r.display_name,
						runs: [],
						page: 0,
						loadingMore: false,
						hasMore: true,
					});
					order.push(r.user_id);
				}
				grouped.get(r.user_id)!.runs.push(r);
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

		const { data, error: feedError } = await fetchRunsFeed({
			limit: PAGE_SIZE,
			offset: user.runs.length,
			userId,
		});

		// A failed page must not look like the end of the feed — keep hasMore and
		// page untouched so the button stays live and the user can retry.
		if (feedError) {
			setError(feedError.message);
			setByUser(
				(prev) =>
					prev?.map((u) => (u.user_id === userId ? { ...u, loadingMore: false } : u)) ?? null,
			);
			return;
		}

		const rows = data ?? [];
		setByUser(
			(prev) =>
				prev?.map((u) =>
					u.user_id === userId
						? {
								...u,
								runs: [...u.runs, ...rows],
								page: rows.length > 0 ? nextPage : u.page,
								loadingMore: false,
								hasMore: rows.length === PAGE_SIZE,
							}
						: u,
				) ?? null,
		);
	}

	if (error && !ready) return <div className="panel"><p className="error">{error}</p></div>;
	if (!ready) return <div className="panel">Loading…</div>;

	return (
		<div className="posts-grid">
			{error && <p className="error">{error}</p>}
			{byUser === null && error ? null : byUser === null ? (
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
