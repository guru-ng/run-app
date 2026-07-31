import { useState } from "react";
import { insertRun } from "@/lib/api/runs";
import type { Run } from "@/lib/types";
import { todayIso } from "@/lib/dates";

export default function LogRunForm({
	userId,
	onLogged,
}: {
	userId: string;
	onLogged: (run: Run) => void;
}) {
	const [distanceKm, setDistanceKm] = useState("");
	const [runDate, setRunDate] = useState(() => todayIso());
	const [notes, setNotes] = useState("");
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

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
			<button className="btn" type="submit" disabled={busy}>
				{busy ? "Logging…" : "Log run"}
			</button>
		</form>
	);
}
