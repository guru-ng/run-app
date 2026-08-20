import { useGpsTracker } from "@/lib/hooks/useGpsTracker";

function formatElapsed(totalSeconds: number) {
	const h = Math.floor(totalSeconds / 3600);
	const m = Math.floor((totalSeconds % 3600) / 60);
	const s = totalSeconds % 60;
	const pad = (n: number) => String(n).padStart(2, "0");
	return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/**
 * GPS stopwatch entry point (tracking tier A — see PLAN.md "Up next").
 * Live-only: no map, nothing persisted until `onFinish` hands the tracked
 * distance to the caller for review in the manual log form.
 */
export default function TrackRunPanel({
	onFinish,
	onUseManualEntry,
}: {
	onFinish: (distanceKm: number) => void;
	onUseManualEntry: () => void;
}) {
	const { status, distanceKm, elapsedSeconds, errorMessage, start, pause, resume, reset } =
		useGpsTracker();

	if (status === "unsupported" || status === "denied" || status === "error") {
		return (
			<div className="track-run-panel">
				<p className="error">
					{status === "unsupported"
						? "This browser doesn't support GPS tracking."
						: status === "denied"
							? "Location access was denied — allow it in your browser's site settings to track a run, or log it manually instead."
							: (errorMessage ?? "Couldn't get a GPS lock. Try again, or log this run manually.")}
				</p>
				<button className="btn btn-secondary" type="button" onClick={onUseManualEntry}>
					Switch to manual entry
				</button>
			</div>
		);
	}

	if (status === "idle") {
		return (
			<div className="track-run-panel">
				<p className="muted">
					Tracks distance live via GPS while you run. No map, nothing saved until you stop and
					review — and it drains battery faster than normal browsing.
				</p>
				<button className="btn" type="button" onClick={start}>
					Start tracking
				</button>
			</div>
		);
	}

	return (
		<div className="track-run-panel">
			<div className="track-run-stats">
				<div className="track-run-stat">
					<span className="track-run-value">{distanceKm.toFixed(2)}</span>
					<span className="track-run-label">km</span>
				</div>
				<div className="track-run-stat">
					<span className="track-run-value">{formatElapsed(elapsedSeconds)}</span>
					<span className="track-run-label">time</span>
				</div>
			</div>
			<div className="track-run-actions">
				{status === "tracking" ? (
					<button className="btn btn-secondary" type="button" onClick={pause}>
						Pause
					</button>
				) : (
					<button className="btn btn-secondary" type="button" onClick={resume}>
						Resume
					</button>
				)}
				<button className="btn" type="button" onClick={() => onFinish(distanceKm)}>
					Stop &amp; review
				</button>
			</div>
			<button className="link" type="button" onClick={reset}>
				Discard
			</button>
		</div>
	);
}
