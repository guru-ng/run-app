import { useEffect, useState } from "react";
import { insertRun } from "@/lib/api/runs";
import type { Run } from "@/lib/types";
import { todayIso } from "@/lib/dates";
import { computePersonalBest, describePersonalBest, type PersonalBest } from "@/lib/personalBests";

/** How many confetti pieces burst outward on a successful log (gamification #1). */
const CONFETTI_PIECES = 10;
/** How long the personal-best banner + confetti stay up before auto-clearing. */
const CELEBRATION_MS = 3200;

export default function LogRunForm({
	userId,
	runs,
	onLogged,
	initialDistanceKm,
}: {
	userId: string;
	/** The user's existing runs, used to work out if the new one is a personal best. */
	runs: Run[] | null;
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

			onLogged(data as Run);
			setCelebration({ best: computePersonalBest(data as Run, runs ?? []), key: Date.now() });
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
					<span className="confetti-burst" aria-hidden="true" key={celebration.key}>
						{Array.from({ length: CONFETTI_PIECES }).map((_, i) => (
							<span
								key={i}
								className="confetti-piece"
								style={
									{
										"--angle": `${(360 / CONFETTI_PIECES) * i}deg`,
										"--delay": `${i * 20}ms`,
									} as React.CSSProperties
								}
							/>
						))}
					</span>
				)}
			</div>
			{celebration && <p className="log-celebration-text">{describePersonalBest(celebration.best)}</p>}
		</form>
	);
}
