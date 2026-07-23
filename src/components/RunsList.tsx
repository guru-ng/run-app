import type { Run } from "@/lib/types";

export default function RunsList({ runs }: { runs: Run[] | null }) {
	return (
		<div className="runs-list">
			{runs === null ? (
				<p className="muted">Loading your runs…</p>
			) : runs.length === 0 ? (
				<p className="muted">No runs logged yet.</p>
			) : (
				runs.map((run) => (
					<div className="run-item" key={run.id}>
						<span>{run.run_date}</span>
						<span>{run.distance_km} km</span>
						{run.notes && <span className="muted">{run.notes}</span>}
					</div>
				))
			)}
		</div>
	);
}
