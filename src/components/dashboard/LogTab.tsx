import { useState } from "react";
import LogRunForm from "@/components/runs/LogRunForm";
import RunsList from "@/components/runs/RunsList";
import TrackRunPanel from "@/components/runs/TrackRunPanel";
import type { EarnedBadge, Run } from "@/lib/types";
import { computeStreak, describeStreak } from "@/lib/streaks";

export default function LogTab({
	userId,
	runs,
	earnedBadges,
	onLogged,
}: {
	userId: string;
	runs: Run[] | null;
	earnedBadges: EarnedBadge[] | null;
	onLogged: (run: Run) => void;
}) {
	const [mode, setMode] = useState<"manual" | "track">("manual");
	// Bumped whenever a tracked session hands off a distance, so LogRunForm
	// remounts and picks up the new initialDistanceKm instead of keeping
	// whatever it had in state from before.
	const [prefill, setPrefill] = useState<{ distanceKm: number; key: number } | null>(null);

	// Gamification #3 (see PLAN.md): a forgiving streak, recomputed from
	// `runs` on every render — no persisted streak state to keep in sync.
	const streakLabel = runs ? describeStreak(computeStreak(runs)) : null;

	return (
		<div className="panel tab-panel">
			<h1 className="brand-title" style={{ fontSize: "1.4rem" }}>
				Log a run
			</h1>
			{streakLabel && <p className="streak-badge">{streakLabel}</p>}
			<div className="log-mode-toggle" role="tablist">
				<button
					type="button"
					role="tab"
					aria-selected={mode === "manual"}
					className={`log-mode-btn${mode === "manual" ? " active" : ""}`}
					onClick={() => setMode("manual")}
				>
					Manual
				</button>
				<button
					type="button"
					role="tab"
					aria-selected={mode === "track"}
					className={`log-mode-btn${mode === "track" ? " active" : ""}`}
					onClick={() => setMode("track")}
				>
					Track a run
				</button>
			</div>
			{mode === "track" ? (
				<TrackRunPanel
					onFinish={(distanceKm) => {
						setPrefill({ distanceKm, key: Date.now() });
						setMode("manual");
					}}
					onUseManualEntry={() => setMode("manual")}
				/>
			) : (
				<LogRunForm
					key={prefill?.key}
					userId={userId}
					runs={runs}
					earnedBadges={earnedBadges}
					onLogged={onLogged}
					initialDistanceKm={prefill?.distanceKm}
				/>
			)}
			<RunsList runs={runs} />
		</div>
	);
}
