import { useEffect, useState } from "react";
import type { PostgrestError } from "@supabase/supabase-js";
import { fetchRunById } from "@/lib/api/runs";
import { isoToDate } from "@/lib/dates";
import type { Run } from "@/lib/types";

function longDateLabel(iso: string) {
	return isoToDate(iso).toLocaleDateString("en-US", {
		weekday: "long",
		month: "long",
		day: "numeric",
		year: "numeric",
	});
}

/**
 * One of your own logged runs, at `/run/?id=<uuid>`. The id comes from the
 * query string rather than a path segment so the page stays part of the static
 * build — no SSR adapter needed. Reachable from your runs list only; other
 * people's feed rows are not links.
 */
export default function RunDetail({ userId }: { userId: string }) {
	const [run, setRun] = useState<Run | null>(null);
	const [error, setError] = useState<PostgrestError | null>(null);
	const [notFound, setNotFound] = useState(false);
	const id = new URLSearchParams(window.location.search).get("id");

	useEffect(() => {
		if (!id) {
			setNotFound(true);
			return;
		}
		fetchRunById(id, userId).then(({ data, error }) => {
			if (error) {
				setError(error);
				return;
			}
			if (!data) {
				setNotFound(true);
				return;
			}
			setRun(data);
		});
	}, [id, userId]);

	if (error) {
		return (
			<div className="panel tab-panel">
				<p className="error">{error.message}</p>
				<a href="/log/" className="link">
					Back to your runs
				</a>
			</div>
		);
	}

	if (notFound) {
		return (
			<div className="panel tab-panel">
				<h1 className="brand-title" style={{ fontSize: "1.4rem" }}>
					Run not found
				</h1>
				<p className="muted">This run doesn't exist, or it isn't one of yours.</p>
				<a href="/log/" className="link">
					Back to your runs
				</a>
			</div>
		);
	}

	if (!run) {
		return (
			<div className="panel tab-panel">
				<p className="muted">Loading run…</p>
			</div>
		);
	}

	return (
		<div className="panel tab-panel run-detail">
			<span className="deck-card-label">{longDateLabel(run.run_date)}</span>
			<span className="deck-card-metric run-detail-metric">{run.distance_km} km</span>
			{run.notes ? (
				<p className="run-detail-notes">{run.notes}</p>
			) : (
				<p className="muted">No notes on this run.</p>
			)}
			<a href="/log/" className="link">
				Back to your runs
			</a>
		</div>
	);
}
