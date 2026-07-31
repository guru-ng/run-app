import { useEffect, useState } from "react";
import type { PostgrestError } from "@supabase/supabase-js";
import { fetchRunsFeed } from "@/lib/api/runs";
import type { FeedRun } from "@/lib/types";

/** Fetch the top `limit` feed rows once, no pagination. */
export function useRunsFeedOnce(limit: number) {
	const [feed, setFeed] = useState<FeedRun[] | null>(null);
	const [error, setError] = useState<PostgrestError | null>(null);

	useEffect(() => {
		fetchRunsFeed({ limit }).then(({ data, error }) => {
			if (error) {
				setError(error);
				return;
			}
			setFeed(data ?? []);
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [limit]);

	return { feed, error, loading: feed === null && !error };
}

/**
 * Paginated feed, `pageSize` rows per page, with prev/next navigation.
 * Pages already fetched are cached in `feed`; `goOlder` only hits the
 * network when the next page isn't cached yet.
 */
export function useRunsFeedPaginated(pageSize: number) {
	const [feed, setFeed] = useState<FeedRun[] | null>(null);
	const [page, setPage] = useState(0);
	const [loadingMore, setLoadingMore] = useState(false);
	const [hasMore, setHasMore] = useState(true);
	const [error, setError] = useState<PostgrestError | null>(null);

	useEffect(() => {
		fetchRunsFeed({ limit: pageSize }).then(({ data, error }) => {
			if (error) {
				setError(error);
				return;
			}
			const rows = data ?? [];
			setFeed(rows);
			setHasMore(rows.length === pageSize);
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pageSize]);

	function goNewer() {
		setPage((p) => Math.max(0, p - 1));
	}

	async function goOlder() {
		if (!feed || loadingMore) return;
		const nextPage = page + 1;
		const cachedEnd = nextPage * pageSize + pageSize;

		if (feed.length >= cachedEnd || !hasMore) {
			if (nextPage * pageSize < feed.length) setPage(nextPage);
			return;
		}

		setLoadingMore(true);
		const { data, error } = await fetchRunsFeed({ limit: pageSize, offset: feed.length });
		if (error) {
			setError(error);
			setLoadingMore(false);
			return;
		}

		const rows = data ?? [];
		setFeed((prev) => [...(prev ?? []), ...rows]);
		setHasMore(rows.length === pageSize);
		if (rows.length > 0) setPage(nextPage);
		setLoadingMore(false);
	}

	const pageFeed = (feed ?? []).slice(page * pageSize, page * pageSize + pageSize);
	const hasNext = feed !== null && ((page + 1) * pageSize < feed.length || hasMore);
	const hasPrev = page > 0;

	return { pageFeed, error, loading: feed === null && !error, loadingMore, hasNext, hasPrev, goNewer, goOlder };
}
