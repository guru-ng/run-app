import { useState } from "react";
import { insertPlannedRun, updatePlannedRun, deletePlannedRun } from "@/lib/api/plannedRuns";
import { todayIso } from "@/lib/dates";
import type { DayAvailability, PlannedRun, RunType, TimeOfDay } from "@/lib/types";

const TIME_OPTIONS: { value: TimeOfDay; label: string }[] = [
	{ value: "morning", label: "Morning" },
	{ value: "afternoon", label: "Afternoon" },
	{ value: "evening", label: "Evening" },
];

const RUN_TYPES: RunType[] = ["Base Run", "Long Run", "Intervals", "Recovery"];

const MAX_SCHEDULED_RUNS = 10;

export default function ScheduleModal({
	userId,
	initialDate,
	existingPlan,
	myPlanCount,
	onClose,
	onScheduled,
	onCanceled,
}: {
	userId: string;
	initialDate: string;
	existingPlan: DayAvailability | null;
	myPlanCount: number;
	onClose: () => void;
	onScheduled: (planned: PlannedRun) => void;
	onCanceled: (id: string) => void;
}) {
	const [date, setDate] = useState(initialDate);
	const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(existingPlan?.time_of_day ?? "morning");
	const [runType, setRunType] = useState<RunType>(existingPlan?.run_type ?? "Base Run");
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function save() {
		// Editing a plan doesn't add one, so the cap only applies to new plans —
		// otherwise you can't change a run once you're at the limit.
		if (!existingPlan && myPlanCount >= MAX_SCHEDULED_RUNS) {
			setError(`You've reached the limit of ${MAX_SCHEDULED_RUNS} scheduled runs.`);
			return;
		}

		if (date < todayIso()) {
			setError("Pick today or a later date.");
			return;
		}

		setBusy(true);
		setError(null);

		try {
			// Update in place when there's already a plan for this day; inserting
			// would leave the old row behind as a duplicate.
			const { data, error: saveError } = existingPlan
				? await updatePlannedRun({
						id: existingPlan.id,
						plannedDate: date,
						timeOfDay,
						runType,
					})
				: await insertPlannedRun({ userId, plannedDate: date, timeOfDay, runType });

			if (saveError) {
				setError(saveError.message);
				return;
			}

			onScheduled(data as PlannedRun);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Couldn't save that run. Try again.");
		} finally {
			setBusy(false);
		}
	}

	async function cancelExisting() {
		if (!existingPlan) return;
		setBusy(true);
		setError(null);

		try {
			const { error: deleteError } = await deletePlannedRun(existingPlan.id);

			if (deleteError) {
				setError(deleteError.message);
				return;
			}

			onCanceled(existingPlan.id);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Couldn't cancel that run. Try again.");
		} finally {
			setBusy(false);
		}
	}

	return (
		<div className="modal-overlay" onClick={onClose}>
			<div className="modal-box panel" onClick={(e) => e.stopPropagation()}>
				<div className="modal-header">
					<h3 className="brand-title" style={{ fontSize: "1.2rem" }}>
						Schedule a run
					</h3>
					<button className="link modal-close" onClick={onClose} aria-label="Close">
						×
					</button>
				</div>
				{existingPlan && (
					<div className="existing-plan-notice">
						<span>
							You already have a {existingPlan.time_of_day} {existingPlan.run_type} planned
							this day.
						</span>
						<button
							className="trash-btn"
							onClick={cancelExisting}
							disabled={busy}
							aria-label="Cancel this scheduled run"
						>
							🗑
						</button>
					</div>
				)}
				<label className="modal-label">Date</label>
				<input
					className="input"
					type="date"
					min={todayIso()}
					value={date}
					onChange={(e) => setDate(e.target.value)}
				/>
				<label className="modal-label">Time of day</label>
				<div className="time-options">
					{TIME_OPTIONS.map((opt) => (
						<button
							key={opt.value}
							type="button"
							className={"time-option" + (timeOfDay === opt.value ? " active" : "")}
							onClick={() => setTimeOfDay(opt.value)}
						>
							{opt.label}
						</button>
					))}
				</div>
				<label className="modal-label">Run type</label>
				<select
					className="input"
					value={runType}
					onChange={(e) => setRunType(e.target.value as RunType)}
				>
					{RUN_TYPES.map((t) => (
						<option key={t} value={t}>
							{t}
						</option>
					))}
				</select>
				{error && <p className="error">{error}</p>}
				<div className="modal-actions">
					<button className="btn btn-secondary" type="button" onClick={onClose}>
						Cancel
					</button>
					<button className="btn" type="button" disabled={busy} onClick={save}>
						{busy ? "Saving…" : "Save"}
					</button>
				</div>
			</div>
		</div>
	);
}
