import { useState } from "react";
import type { Run } from "@/lib/types";

const PAGE_SIZE = 3;

export default function RunsList({ runs }: { runs: Run[] | null }) {
	const [page, setPage] = useState(0);

	if (runs === null) {
		return (
			<div className="runs-list">
				<p className="muted">Loading your runs…</p>
			</div>
		);
	}

	if (runs.length === 0) {
		return (
			<div className="runs-list">
				<p className="muted">No runs logged yet.</p>
			</div>
		);
	}

	const pageRuns = runs.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
	const hasNext = (page + 1) * PAGE_SIZE < runs.length;

	return (
		<div>
			<div className="post-card-head">
				<h2 className="brand-title" style={{ fontSize: "1.1rem" }}>
					Your runs
				</h2>
				<div className="post-card-nav">
					<button
						className="page-nav-btn"
						disabled={page === 0}
						onClick={() => setPage((p) => p - 1)}
						aria-label="Newer runs"
					>
						‹
					</button>
					<button
						className="page-nav-btn"
						disabled={!hasNext}
						onClick={() => setPage((p) => p + 1)}
						aria-label="Older runs"
					>
						›
					</button>
				</div>
			</div>
			<div className="runs-list">
				{/* Only your own runs get a detail page — feed rows elsewhere on the
				    site stay non-clickable. */}
				{pageRuns.map((run) => (
					<a className="run-item run-item-link" key={run.id} href={`/run/?id=${run.id}`}>
						<span>{run.run_date}</span>
						<span>{run.distance_km} km</span>
						{run.notes && <span className="muted">{run.notes}</span>}
					</a>
				))}
			</div>
		</div>
	);
}
