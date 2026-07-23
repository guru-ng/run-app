import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Run } from "@/lib/types";

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

		const { data, error: insertError } = await supabase
			.from("runs")
			.insert({
				user_id: userId,
				distance_km: Number(distanceKm),
				run_date: runDate,
				notes: notes.trim() || null,
			})
			.select("id, distance_km, run_date, notes")
			.single();

		if (insertError) {
			setError(insertError.message);
			setBusy(false);
			return;
		}

		onLogged(data as Run);
		setDistanceKm("");
		setNotes("");
		setBusy(false);
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
			/>
			{error && <p className="error">{error}</p>}
			<button className="btn" type="submit" disabled={busy}>
				{busy ? "Logging…" : "Log run"}
			</button>
		</form>
	);
}

function todayIso() {
	return new Date().toISOString().slice(0, 10);
}
