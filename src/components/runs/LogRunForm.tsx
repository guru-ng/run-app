import { useEffect, useState } from "react";
import { insertRun } from "@/lib/api/runs";
import type { EarnedBadge, Run } from "@/lib/types";
import { todayIso } from "@/lib/dates";
import { computePersonalBest, describePersonalBest, type PersonalBest } from "@/lib/personalBests";
import { seasonalFireworkPalette } from "@/lib/season";
import { computeNewlyCrossedBadges, describeNewBadges } from "@/lib/badges";

/** How many pixel sparks burst outward on a successful log (gamification #1). */
const FIREWORK_PIECES = 12;
/** How long the personal-best banner + firework stay up before auto-clearing. */
const CELEBRATION_MS = 3200;
/** Cycled per spark so the burst isn't a single flat color — rotates with the calendar. */
const FIREWORK_COLORS = seasonalFireworkPalette();

export default function LogRunForm({
	userId,
	runs,
	earnedBadges,
	onLogged,
	initialDistanceKm,
}: {
	userId: string;
	/** The user's existing runs, used to work out if the new one is a personal best. */
	runs: Run[] | null;
	/** Already-earned badges, used to work out if the new run crosses a new one. */
	earnedBadges: EarnedBadge[] | null;
	onLogged: (run: Run) => void;
	/** Prefilled from a finished GPS-tracked session (tier A) for review before save. */
	initialDistanceKm?: number;
}) {
	const [distanceKm, setDistanceKm] = useState(() =>
		initialDistanceKm ? initialDistanceKm.toFixed(2) : "",
	);
	const [runDate, setRunDate] = useState(() => todayIso());
	const [notes, setNotes] = useState("");
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [celebration, setCelebration] = useState<{
		best: PersonalBest | null;
		badgeText: string | null;
		key: number;
	} | null>(null);

	// Auto-clear the celebration rather than leaving a stale banner up while
	// the user starts typing their next entry.
	useEffect(() => {
		if (!celebration) return;
		const timer = window.setTimeout(() => setCelebration(null), CELEBRATION_MS);
		return () => window.clearTimeout(timer);
	}, [celebration]);

	async function logRun(e: React.FormEvent) {
		e.preventDefault();
		setBusy(true);
		setError(null);

		try {
			const { data, error: insertError } = await insertRun({
				userId,
				distanceKm: Number(distanceKm),
				runDate,
				notes: notes.trim() || null,
			});

			if (insertError) {
				setError(insertError.message);
				return;
			}

			const priorRuns = runs ?? [];
			const earnedKeys = new Set((earnedBadges ?? []).map((b) => b.badge_key));
			const newBadges = computeNewlyCrossedBadges(data as Run, priorRuns, earnedKeys);

			onLogged(data as Run);
			setCelebration({
				best: computePersonalBest(data as Run, priorRuns),
				badgeText: describeNewBadges(newBadges),
				key: Date.now(),
			});
			setDistanceKm("");
			setNotes("");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Couldn't log that run. Try again.");
		} finally {
			setBusy(false);
		}
	}

	return (
		<form className="form" onSubmit={logRun}>
			<input
				className="input"
				type="number"
				inputMode="decimal"
				step="0.01"
				min="0.01"
				max="999.99"
				placeholder="Distance (km)"
				value={distanceKm}
				onChange={(e) => setDistanceKm(e.target.value)}
				required
			/>
			<input
				className="input"
				type="date"
				value={runDate}
				onChange={(e) => setRunDate(e.target.value)}
				required
			/>
			<input
				className="input"
				placeholder="Notes (optional)"
				value={notes}
				onChange={(e) => setNotes(e.target.value)}
				maxLength={300}
			/>
			{error && <p className="error">{error}</p>}
			<div className="log-submit-row">
				<button className="btn" type="submit" disabled={busy}>
					{busy ? "Logging…" : "Log run"}
				</button>
				{celebration && (
					<span className="firework-burst" aria-hidden="true" key={celebration.key}>
						{Array.from({ length: FIREWORK_PIECES }).map((_, i) => (
							<span
								key={i}
								className="firework-pixel"
								style={
									{
										"--angle": `${(360 / FIREWORK_PIECES) * i}deg`,
										"--delay": `${i * 18}ms`,
										"--spark-color": FIREWORK_COLORS[i % FIREWORK_COLORS.length],
									} as React.CSSProperties
								}
							/>
						))}
					</span>
				)}
			</div>
			{celebration && <p className="log-celebration-text">{describePersonalBest(celebration.best)}</p>}
			{celebration?.badgeText && <p className="log-celebration-badge">{celebration.badgeText}</p>}
		</form>
	);
}
