import { useMemo, useState } from "react";
import type { DayAvailability, PlannedRun } from "@/lib/types";
import { addMonths, getMonthGrid, todayIso } from "@/lib/dates";
import { usePlannedRunActions } from "@/lib/hooks/usePlannedRunActions";
import ScheduleModal from "@/components/schedule/ScheduleModal";

const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

export default function AvailabilityCard({
	userId,
	allPlans,
	onScheduled,
	onCanceled,
}: {
	userId: string;
	allPlans: DayAvailability[] | null;
	onScheduled: (planned: PlannedRun) => void;
	onCanceled: (id: string) => void;
}) {
	const [modalDate, setModalDate] = useState<string | null>(null);
	const [viewedMonth, setViewedMonth] = useState(() => new Date());

	const cells = getMonthGrid(viewedMonth);
	const today = todayIso();

	const plansByDate = useMemo(() => {
		const map = new Map<string, DayAvailability[]>();
		for (const plan of allPlans ?? []) {
			const list = map.get(plan.planned_date) ?? [];
			list.push(plan);
			map.set(plan.planned_date, list);
		}
		return map;
	}, [allPlans]);

	const { cancelPlan } = usePlannedRunActions(onCanceled);

	const modalDayPlans = modalDate ? (plansByDate.get(modalDate) ?? []) : [];
	const myExistingPlan = modalDayPlans.find((p) => p.user_id === userId) ?? null;
	const myPlanCount = (allPlans ?? []).filter((p) => p.user_id === userId).length;

	return (
		<div>
			<div className="calendar-header">
				<h2 className="brand-title" style={{ fontSize: "1.1rem" }}>
					Availability
				</h2>
				<button className="btn btn-small" onClick={() => setModalDate(todayIso())}>
					Schedule run
				</button>
			</div>
			<div className="calendar-month-nav">
				<button
					className="page-nav-btn"
					onClick={() => setViewedMonth((d) => addMonths(d, -1))}
					aria-label="Previous month"
				>
					‹
				</button>
				<span className="calendar-month-label">
					{viewedMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
				</span>
				<button
					className="page-nav-btn"
					onClick={() => setViewedMonth((d) => addMonths(d, 1))}
					aria-label="Next month"
				>
					›
				</button>
			</div>
			<div className="calendar-grid calendar-weekdays">
				{WEEKDAY_LABELS.map((label, i) => (
					<div key={i} className="calendar-weekday">
						{label}
					</div>
				))}
			</div>
			<div className="calendar-grid">
				{cells.map((cell) => {
					const dayPlans = plansByDate.get(cell.iso) ?? [];
					// You can't plan a run that's already been and gone. Past days stay
					// visible (their tooltips still work) but aren't clickable.
					const isPast = cell.iso < today;
					return (
						<div className="calendar-day-wrap" key={cell.iso}>
							<button
								className={
									"calendar-day" +
									(cell.isToday ? " today" : "") +
									(dayPlans.length > 0 ? " planned" : "") +
									(cell.inMonth ? "" : " outside")
								}
								disabled={isPast}
								onClick={() => setModalDate(cell.iso)}
							>
								{cell.day}
								{dayPlans.length > 0 && <span className="calendar-dot" />}
							</button>
							{dayPlans.length > 0 && (
								<div className="calendar-tooltip">
									{dayPlans.map((plan) => (
										<div key={plan.id} className="calendar-tooltip-row">
											<strong>{plan.user_id === userId ? "You" : plan.display_name}</strong>
											<span className="muted">
												{" "}
												— {plan.time_of_day}, {plan.run_type}
											</span>
											{plan.user_id === userId && (
												<button
													className="trash-btn"
													onClick={() => cancelPlan(plan.id)}
													aria-label="Cancel this scheduled run"
												>
													🗑
												</button>
											)}
										</div>
									))}
								</div>
							)}
						</div>
					);
				})}
			</div>
			{modalDate && (
				<ScheduleModal
					userId={userId}
					initialDate={modalDate}
					existingPlan={myExistingPlan}
					myPlanCount={myPlanCount}
					onClose={() => setModalDate(null)}
					onScheduled={(planned) => {
						onScheduled(planned);
						setModalDate(null);
					}}
					onCanceled={(id) => {
						onCanceled(id);
						setModalDate(null);
					}}
				/>
			)}
		</div>
	);
}
